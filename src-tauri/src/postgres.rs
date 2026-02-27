use std::ffi::OsString;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Manager;

const POSTGRES_PORT: u16 = 55432;

#[cfg(target_os = "windows")]
pub fn start_embedded_postgres(app: &tauri::AppHandle) -> io::Result<()> {
    let runtime = EmbeddedPostgres::new(app)?;
    runtime.init_if_needed()?;

    if !runtime.is_running()? {
        runtime.start()?;
    }

    app.manage(runtime);
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn start_embedded_postgres(_app: &tauri::AppHandle) -> io::Result<()> {
    Ok(())
}

pub fn dev_runtime_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("postgres")
}

pub fn required_runtime_paths() -> [&'static str; 4] {
    [
        "bin/postgres.exe",
        "bin/pg_ctl.exe",
        "bin/initdb.exe",
        "share/postgresql.conf.sample",
    ]
}

pub fn postgres_connection_url() -> String {
    format!("postgresql://postgres@127.0.0.1:{POSTGRES_PORT}/postgres")
}

#[cfg(target_os = "windows")]
#[derive(Clone)]
struct EmbeddedPostgres {
    root_dir: PathBuf,
    bin_dir: PathBuf,
    data_dir: PathBuf,
    log_file: PathBuf,
}

#[cfg(target_os = "windows")]
impl EmbeddedPostgres {
    fn new(app: &tauri::AppHandle) -> io::Result<Self> {
        let root_dir = normalize_windows_path(runtime_root(app)?);
        let bin_dir = root_dir.join("bin");

        for rel in required_runtime_paths() {
            let path = root_dir.join(rel);
            if !path.exists() {
                return Err(io::Error::new(
                    io::ErrorKind::NotFound,
                    format!("missing postgres runtime file: {}", path.display()),
                ));
            }
        }

        let app_data_dir = normalize_windows_path(app.path().app_data_dir().map_err(io::Error::other)?);
        fs::create_dir_all(&app_data_dir)?;
        let data_dir = normalize_windows_path(app_data_dir.join("postgres-data"));
        let log_file = normalize_windows_path(app_data_dir.join("postgres.log"));

        Ok(Self {
            root_dir,
            bin_dir,
            data_dir,
            log_file,
        })
    }

    fn init_if_needed(&self) -> io::Result<()> {
        if self.data_dir.join("PG_VERSION").exists() {
            return Ok(());
        }

        fs::create_dir_all(&self.data_dir)?;

        let initdb = self.bin_dir.join("initdb.exe");
        run_command(
            &initdb,
            &[
                OsString::from("-D"),
                self.data_dir.as_os_str().to_os_string(),
                OsString::from("-U"),
                OsString::from("postgres"),
                OsString::from("-A"),
                OsString::from("trust"),
                OsString::from("--encoding=UTF8"),
            ],
            &self.bin_dir,
            &self.root_dir,
        )
    }

    fn is_running(&self) -> io::Result<bool> {
        let status = Command::new(self.bin_dir.join("pg_ctl.exe"))
            .arg("-D")
            .arg(&self.data_dir)
            .arg("status")
            .current_dir(&self.bin_dir)
            .env("PATH", prefixed_path_env(&self.bin_dir))
            .env("PGSHAREDIR", self.root_dir.join("share"))
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()?;

        Ok(status.success())
    }

    fn start(&self) -> io::Result<()> {
        let pg_ctl = self.bin_dir.join("pg_ctl.exe");
        run_command(
            &pg_ctl,
            &[
                OsString::from("-D"),
                self.data_dir.as_os_str().to_os_string(),
                OsString::from("-l"),
                self.log_file.as_os_str().to_os_string(),
                OsString::from("-w"),
                OsString::from("-o"),
                OsString::from(format!("-p {POSTGRES_PORT}")),
                OsString::from("start"),
            ],
            &self.bin_dir,
            &self.root_dir,
        )
    }

    fn stop(&self) {
        let _ = Command::new(self.bin_dir.join("pg_ctl.exe"))
            .arg("-D")
            .arg(&self.data_dir)
            .arg("-m")
            .arg("fast")
            .arg("stop")
            .current_dir(&self.bin_dir)
            .env("PATH", prefixed_path_env(&self.bin_dir))
            .env("PGSHAREDIR", self.root_dir.join("share"))
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
    }
}

#[cfg(target_os = "windows")]
impl Drop for EmbeddedPostgres {
    fn drop(&mut self) {
        self.stop();
    }
}

#[cfg(target_os = "windows")]
fn run_command(
    executable: &Path,
    args: &[OsString],
    bin_dir: &Path,
    root_dir: &Path,
) -> io::Result<()> {
    let output = Command::new(normalize_windows_path(executable.to_path_buf()))
        .args(args)
        .current_dir(bin_dir)
        .env("PATH", prefixed_path_env(bin_dir))
        .env("PGSHAREDIR", root_dir.join("share"))
        .output()?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    Err(io::Error::other(format!(
        "{} failed (status: {:?})\nstdout: {}\nstderr: {}",
        executable.display(),
        output.status.code(),
        stdout.trim(),
        stderr.trim()
    )))
}

#[cfg(target_os = "windows")]
fn prefixed_path_env(bin_dir: &Path) -> OsString {
    let mut path = OsString::new();
    path.push(bin_dir.as_os_str());
    path.push(";");
    path.push(std::env::var_os("PATH").unwrap_or_default());
    path
}

#[cfg(target_os = "windows")]
fn runtime_root(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let dev = dev_runtime_root();
    if cfg!(debug_assertions) && dev.exists() {
        return Ok(dev);
    }

    let bundled = app
        .path()
        .resource_dir()
        .map_err(io::Error::other)?
        .join("postgres");
    if bundled.exists() {
        return Ok(bundled);
    }

    if dev.exists() {
        return Ok(dev);
    }

    Err(io::Error::new(
        io::ErrorKind::NotFound,
        format!(
            "postgres runtime not found in {} or {}",
            bundled.display(),
            dev.display()
        ),
    ))
}

#[cfg(target_os = "windows")]
fn normalize_windows_path(path: PathBuf) -> PathBuf {
    let raw = path.to_string_lossy();
    if let Some(stripped) = raw.strip_prefix(r"\\?\UNC\") {
        return PathBuf::from(format!(r"\\{stripped}"));
    }
    if let Some(stripped) = raw.strip_prefix(r"\\?\") {
        return PathBuf::from(stripped);
    }
    path
}
