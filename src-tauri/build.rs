use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    tauri_build::build();

    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
    let vendored_include = manifest_dir.join("third-party").join("sleuthkit").join("include");

    let include_dir = configure_linking(&manifest_dir, &vendored_include);
    generate_bindings(&include_dir);
}

fn configure_linking(manifest_dir: &Path, vendored_include: &Path) -> PathBuf {
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let use_vendored = env::var_os("CARGO_FEATURE_VENDORED_TSK").is_some();

    if target_os == "windows" {
        let lib_dir = manifest_dir.join("native").join("x64");
        println!("cargo:rustc-link-search=native={}", lib_dir.display());
        println!("cargo:rustc-link-lib=dylib=tsk");
        println!("cargo:rerun-if-changed={}", lib_dir.display());

        if let Some(profile_dir) = find_profile_dir() {
            copy_runtime_dlls(&lib_dir, &profile_dir);
        }

        return vendored_include.to_path_buf();
    }

    if use_vendored {
        let source_dir = manifest_dir
            .join("third-party")
            .join("sleuthkit")
            .join("source");
        if !source_dir.exists() {
            panic!(
                "vendored-tsk enabled, but source not found at {}",
                source_dir.display()
            );
        }

        build_vendored_tsk(&source_dir);
        let lib_dir = source_dir.join("tsk").join(".libs");
        println!("cargo:rustc-link-search=native={}", lib_dir.display());
        println!("cargo:rustc-link-lib=static=tsk");
        println!("cargo:rustc-link-lib=dylib=sqlite3");
        println!("cargo:rustc-link-lib=dylib=crypto");
        println!("cargo:rustc-link-lib=dylib=z");
        println!("cargo:rustc-link-lib=dylib=pthread");
        if target_os == "macos" {
            println!("cargo:rustc-link-lib=dylib=c++");
        } else {
            println!("cargo:rustc-link-lib=dylib=stdc++");
        }

        return source_dir;
    }

    if let Ok(lib) = pkg_config::Config::new().probe("libtsk") {
        if let Some(include) = lib.include_paths.first() {
            return include.clone();
        }
    }

    if let Ok(root) = env::var("SLEUTHKIT_DIR") {
        let root = PathBuf::from(root);
        let include_dir = root.join("include");
        let lib_dir = root.join("lib");
        println!("cargo:rustc-link-search=native={}", lib_dir.display());
        println!("cargo:rustc-link-lib=tsk");
        return include_dir;
    }

    println!("cargo:rustc-link-lib=tsk");
    vendored_include.to_path_buf()
}

fn generate_bindings(include_dir: &Path) {
    let out_dir = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR"));
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
    let wrapper = manifest_dir.join("wrapper.h");
    let vendored_source = manifest_dir.join("third-party").join("sleuthkit").join("source");

    println!("cargo:rerun-if-changed={}", wrapper.display());
    println!("cargo:rerun-if-changed={}", include_dir.display());
    println!("cargo:rerun-if-changed={}", vendored_source.display());

    let (wrapper_header, extra_include_dir) = if vendored_source.join("tsk").join("libtsk.h").exists() {
        (vendored_source.join("tsk").join("libtsk.h"), Some(vendored_source))
    } else if include_dir.join("tsk").join("libtsk.h").exists() {
        (include_dir.join("tsk").join("libtsk.h"), None)
    } else if include_dir.join("libtsk.h").exists() {
        (include_dir.join("libtsk.h"), None)
    } else {
        (wrapper.clone(), None)
    };

    let generated = std::panic::catch_unwind(|| {
        let mut builder = bindgen::Builder::default()
            .header(wrapper_header.display().to_string())
            .clang_arg(format!("-I{}", include_dir.display()))
            .allowlist_function("tsk_.*")
            .allowlist_type("TSK_.*")
            .allowlist_var("TSK_.*");

        if let Some(extra_include_dir) = extra_include_dir {
            if extra_include_dir != include_dir {
                builder = builder.clang_arg(format!("-I{}", extra_include_dir.display()));
            }
        }

        builder.generate()
    });

    let out_file = out_dir.join("bindings.rs");
    match generated {
        Ok(Ok(bindings)) => {
            bindings.write_to_file(&out_file).expect("failed to write bindings");
        }
        Ok(Err(err)) => {
            println!("cargo:warning=bindgen unavailable, using fallback bindings: {err}");
            write_fallback_bindings(&out_file);
        }
        Err(_) => {
            println!("cargo:warning=bindgen panicked, using fallback bindings");
            write_fallback_bindings(&out_file);
        }
    }
}

fn build_vendored_tsk(source_dir: &Path) {
    println!("cargo:rerun-if-changed={}", source_dir.display());

    if source_dir.join("Makefile").exists() {
        run_cmd_allow_fail(source_dir, "make", &["distclean"]);
    }

    if !source_dir.join("configure").exists() {
        run_cmd(source_dir, "sh", &["./bootstrap"]);
    }

    run_cmd(
        source_dir,
        "sh",
        &[
            "-c",
            "./configure --disable-java --disable-shared --enable-static --without-afflib --without-libewf --without-libvhdi --without-libvmdk --without-libvslvm --without-libbfio --without-libqcow --without-aff4",
        ],
    );

    let jobs = env::var("NUM_JOBS").unwrap_or_else(|_| "4".to_string());
    run_cmd(source_dir, "make", &["-j", &jobs]);
}

fn run_cmd(cwd: &Path, program: &str, args: &[&str]) {
    let status = Command::new(program)
        .args(args)
        .current_dir(cwd)
        .status()
        .unwrap_or_else(|err| panic!("failed to run {}: {}", program, err));
    if !status.success() {
        panic!("command failed: {} {:?}", program, args);
    }
}

fn run_cmd_allow_fail(cwd: &Path, program: &str, args: &[&str]) {
    let _ = Command::new(program).args(args).current_dir(cwd).status();
}

fn write_fallback_bindings(out_file: &Path) {
    let fallback = r#"
pub type TSK_OFF_T = i64;
pub type TSK_INUM_T = u64;

pub const TSK_IMG_TYPE_DETECT: u32 = 0;
pub const TSK_FS_TYPE_DETECT: u32 = 0;
pub const TSK_FS_NAME_TYPE_DIR: u32 = 3;
pub const TSK_FS_NAME_TYPE_VIRT_DIR: u32 = 11;

#[repr(C)]
pub struct TSK_IMG_INFO {
    _private: [u8; 0],
}

#[repr(C)]
pub struct TSK_FS_INFO {
    _private: [u8; 0],
}

#[repr(C)]
pub struct TSK_FS_DIR {
    _private: [u8; 0],
}

#[repr(C)]
pub struct TSK_FS_NAME {
    pub tag: i32,
    pub name: *mut ::std::os::raw::c_char,
    pub name_size: usize,
    pub shrt_name: *mut ::std::os::raw::c_char,
    pub shrt_name_size: usize,
    pub meta_addr: TSK_INUM_T,
    pub meta_seq: u32,
    pub par_addr: TSK_INUM_T,
    pub par_seq: u32,
    pub date_added: u64,
    pub type_: u32,
    pub flags: u32,
}

unsafe extern "C" {
    pub fn tsk_img_open_utf8_sing(
        a_image: *const ::std::os::raw::c_char,
        img_type: u32,
        sector_size: u32,
    ) -> *mut TSK_IMG_INFO;
    pub fn tsk_img_close(img: *mut TSK_IMG_INFO);

    pub fn tsk_fs_open_img(
        img: *mut TSK_IMG_INFO,
        offset: TSK_OFF_T,
        fstype: u32,
    ) -> *mut TSK_FS_INFO;
    pub fn tsk_fs_close(fs: *mut TSK_FS_INFO);

    pub fn tsk_fs_dir_open(
        fs: *mut TSK_FS_INFO,
        path: *const ::std::os::raw::c_char,
    ) -> *mut TSK_FS_DIR;
    pub fn tsk_fs_dir_getsize(dir: *const TSK_FS_DIR) -> usize;
    pub fn tsk_fs_dir_get_name(dir: *const TSK_FS_DIR, idx: usize) -> *const TSK_FS_NAME;
    pub fn tsk_fs_dir_close(dir: *mut TSK_FS_DIR);

    pub fn tsk_error_get() -> *const ::std::os::raw::c_char;
    pub fn tsk_error_get_errno() -> u32;
}
"#;

    fs::write(out_file, fallback).expect("failed to write fallback bindings");
}

fn find_profile_dir() -> Option<PathBuf> {
    let out_dir = PathBuf::from(env::var("OUT_DIR").ok()?);
    for ancestor in out_dir.ancestors() {
        if let Some(name) = ancestor.file_name().and_then(|n| n.to_str()) {
            if name == "debug" || name == "release" {
                return Some(ancestor.to_path_buf());
            }
        }
    }
    None
}

fn copy_runtime_dlls(lib_dir: &Path, profile_dir: &Path) {
    let deps_dir = profile_dir.join("deps");
    let Ok(entries) = fs::read_dir(lib_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("dll") {
            continue;
        }

        if let Some(name) = path.file_name() {
            let _ = fs::copy(&path, profile_dir.join(name));
            let _ = fs::copy(&path, deps_dir.join(name));
        }
    }
}
