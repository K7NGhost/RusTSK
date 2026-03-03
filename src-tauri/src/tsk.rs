use std::ffi::{CStr, CString};
use std::path::Path;
use std::collections::HashSet;

use serde::Serialize;

use crate::tsk_sys;

const IMG_TYPE_DETECT: tsk_sys::TSK_IMG_TYPE_ENUM = tsk_sys::TSK_IMG_TYPE_ENUM_TSK_IMG_TYPE_DETECT;
const FS_TYPE_DETECT: tsk_sys::TSK_FS_TYPE_ENUM = tsk_sys::TSK_FS_TYPE_ENUM_TSK_FS_TYPE_DETECT;
const VS_TYPE_DETECT: tsk_sys::TSK_VS_TYPE_ENUM = tsk_sys::TSK_VS_TYPE_ENUM_TSK_VS_TYPE_DETECT;
const VS_PART_FLAG_ALLOC: tsk_sys::TSK_VS_PART_FLAG_ENUM =
    tsk_sys::TSK_VS_PART_FLAG_ENUM_TSK_VS_PART_FLAG_ALLOC;
const FS_NAME_TYPE_DIR: tsk_sys::TSK_FS_NAME_TYPE_ENUM =
    tsk_sys::TSK_FS_NAME_TYPE_ENUM_TSK_FS_NAME_TYPE_DIR;
const FS_NAME_TYPE_VIRT_DIR: tsk_sys::TSK_FS_NAME_TYPE_ENUM =
    tsk_sys::TSK_FS_NAME_TYPE_ENUM_TSK_FS_NAME_TYPE_VIRT_DIR;

#[derive(Debug, Clone)]
pub struct TskError {
    pub code: u32,
    pub message: String,
}

impl std::fmt::Display for TskError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "TSK error {}: {}", self.code, self.message)
    }
}

impl std::error::Error for TskError {}

fn last_tsk_error() -> TskError {
    unsafe {
        let code = tsk_sys::tsk_error_get_errno();
        let msg_ptr = tsk_sys::tsk_error_get();
        let message = if msg_ptr.is_null() {
            "Unknown Sleuth Kit error".to_string()
        } else {
            CStr::from_ptr(msg_ptr).to_string_lossy().into_owned()
        };
        TskError { code, message }
    }
}

fn c_string_or_empty(ptr: *const std::os::raw::c_char) -> String {
    if ptr.is_null() {
        String::new()
    } else {
        unsafe { CStr::from_ptr(ptr).to_string_lossy().into_owned() }
    }
}

unsafe fn read_dir_entries_from_open_dir(dir: *mut tsk_sys::TSK_FS_DIR) -> Vec<DirEntry> {
    let raw_entries = read_raw_dir_entries_from_open_dir(dir);
    raw_entries
        .into_iter()
        .map(|entry| DirEntry {
            name: entry.name,
            meta_addr: entry.meta_addr,
            is_dir: entry.is_dir,
        })
        .collect()
}

#[derive(Debug, Clone)]
struct RawDirEntry {
    name: String,
    meta_addr: u64,
    is_dir: bool,
}

unsafe fn read_raw_dir_entries_from_open_dir(dir: *mut tsk_sys::TSK_FS_DIR) -> Vec<RawDirEntry> {
    let mut entries = Vec::new();
    let count = unsafe { tsk_sys::tsk_fs_dir_getsize(dir) };
    for idx in 0..count {
        let name_ptr = unsafe { tsk_sys::tsk_fs_dir_get_name(dir, idx) };
        if name_ptr.is_null() {
            continue;
        }

        let name_ref = unsafe { &*name_ptr };
        if name_ref.name.is_null() {
            continue;
        }

        let name = unsafe { CStr::from_ptr(name_ref.name) }
            .to_string_lossy()
            .into_owned();

        if name == "." || name == ".." || name.is_empty() {
            continue;
        }

        let is_dir =
            name_ref.type_ == FS_NAME_TYPE_DIR || name_ref.type_ == FS_NAME_TYPE_VIRT_DIR;

        entries.push(RawDirEntry {
            name,
            meta_addr: name_ref.meta_addr,
            is_dir,
        });
    }

    entries
}

unsafe fn read_raw_dir_entries_from_meta(
    fs: *mut tsk_sys::TSK_FS_INFO,
    inum: tsk_sys::TSK_INUM_T,
) -> Result<Vec<RawDirEntry>, TskError> {
    let dir = unsafe { tsk_sys::tsk_fs_dir_open_meta(fs, inum) };
    if dir.is_null() {
        return Err(last_tsk_error());
    }

    let entries = unsafe { read_raw_dir_entries_from_open_dir(dir) };
    unsafe { tsk_sys::tsk_fs_dir_close(dir) };
    Ok(entries)
}

fn join_tsk_path(parent_path: &str, name: &str) -> String {
    if parent_path == "/" {
        format!("/{name}")
    } else {
        format!("{}/{}", parent_path.trim_end_matches('/'), name)
    }
}

unsafe fn collect_folders_and_files(
    fs: *mut tsk_sys::TSK_FS_INFO,
    dir_inum: tsk_sys::TSK_INUM_T,
    parent_path: &str,
    visited_dirs: &mut HashSet<u64>,
    files: &mut Vec<FileEntry>,
) -> Result<Vec<FolderNode>, TskError> {
    let entries = unsafe { read_raw_dir_entries_from_meta(fs, dir_inum)? };
    let mut folders = Vec::new();

    for entry in entries {
        let full_path = join_tsk_path(parent_path, &entry.name);

        if entry.is_dir {
            let children = if entry.meta_addr == 0 || !visited_dirs.insert(entry.meta_addr) {
                Vec::new()
            } else {
                unsafe {
                    collect_folders_and_files(
                        fs,
                        entry.meta_addr as tsk_sys::TSK_INUM_T,
                        &full_path,
                        visited_dirs,
                        files,
                    )?
                }
            };

            folders.push(FolderNode {
                name: entry.name,
                path: full_path,
                meta_addr: entry.meta_addr,
                children,
            });
        } else {
            files.push(FileEntry {
                name: entry.name,
                path: full_path,
                parent_path: parent_path.to_string(),
                meta_addr: entry.meta_addr,
            });
        }
    }

    Ok(folders)
}

#[derive(Debug, Clone, Serialize)]
pub struct FileSystemTree {
    pub id: String,
    pub label: String,
    pub offset: i64,
    pub fs_type: String,
    pub folders: Vec<FolderNode>,
    pub files: Vec<FileEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FolderNode {
    pub name: String,
    pub path: String,
    pub meta_addr: u64,
    pub children: Vec<FolderNode>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub parent_path: String,
    pub meta_addr: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DataSourceTree {
    pub image_path: String,
    pub image_name: String,
    pub filesystems: Vec<FileSystemTree>,
}

pub fn discover_data_source_tree(image_path: &Path) -> Result<DataSourceTree, TskError> {
    let img = Image::open(image_path)?;
    let mut filesystems = Vec::new();
    let mut seen_offsets = HashSet::<i64>::new();

    unsafe {
        let fs0 = tsk_sys::tsk_fs_open_img(img.raw, 0, FS_TYPE_DETECT);
        if !fs0.is_null() {
            let offset = (*fs0).__bindgen_anon_1.offset as i64;
            if !seen_offsets.contains(&offset) {
                let root_inum = (*fs0).root_inum;
                let mut files = Vec::new();
                let mut visited_dirs = HashSet::<u64>::new();
                visited_dirs.insert(root_inum as u64);
                let folders =
                    collect_folders_and_files(fs0, root_inum, "/", &mut visited_dirs, &mut files)?;
                let fs_type = c_string_or_empty(tsk_sys::tsk_fs_type_toname((*fs0).ftype));
                filesystems.push(FileSystemTree {
                    id: format!("fs-{}", offset),
                    label: format!("Filesystem @ {}", offset),
                    offset,
                    fs_type,
                    folders,
                    files,
                });
                seen_offsets.insert(offset);
            }
            tsk_sys::tsk_fs_close(fs0);
        }

        let vs = tsk_sys::tsk_vs_open(img.raw, 0, VS_TYPE_DETECT);
        if !vs.is_null() {
            let part_count = (*vs).part_count;
            for idx in 0..part_count {
                let part = tsk_sys::tsk_vs_part_get(vs, idx);
                if part.is_null() {
                    continue;
                }

                if ((*part).flags & VS_PART_FLAG_ALLOC) == 0 {
                    continue;
                }

                let fs = tsk_sys::tsk_fs_open_vol(part, FS_TYPE_DETECT);
                if fs.is_null() {
                    continue;
                }

                let offset = (*fs).__bindgen_anon_1.offset as i64;
                if !seen_offsets.contains(&offset) {
                    let root_inum = (*fs).root_inum;
                    let mut files = Vec::new();
                    let mut visited_dirs = HashSet::<u64>::new();
                    visited_dirs.insert(root_inum as u64);
                    let folders = collect_folders_and_files(
                        fs,
                        root_inum,
                        "/",
                        &mut visited_dirs,
                        &mut files,
                    )?;
                    let fs_type = c_string_or_empty(tsk_sys::tsk_fs_type_toname((*fs).ftype));
                    let part_desc = c_string_or_empty((*part).desc);

                    filesystems.push(FileSystemTree {
                        id: format!("part-{}-{}", idx, offset),
                        label: if part_desc.is_empty() {
                            format!("Partition {} @ {}", idx, offset)
                        } else {
                            format!("Partition {} ({})", idx, part_desc)
                        },
                        offset,
                        fs_type,
                        folders,
                        files,
                    });
                    seen_offsets.insert(offset);
                }

                tsk_sys::tsk_fs_close(fs);
            }

            tsk_sys::tsk_vs_close(vs);
        }
    }

    if filesystems.is_empty() {
        return Err(TskError {
            code: 0,
            message: "No filesystem found at image root or allocated partitions".to_string(),
        });
    }

    let image_name = image_path
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| image_path.to_string_lossy().into_owned());

    Ok(DataSourceTree {
        image_path: image_path.to_string_lossy().into_owned(),
        image_name,
        filesystems,
    })
}

pub struct Image {
    raw: *mut tsk_sys::TSK_IMG_INFO,
}

impl Image {
    pub fn open(path: &Path) -> Result<Self, TskError> {
        let path = path.to_str().ok_or_else(|| TskError {
            code: 0,
            message: "Path is not valid UTF-8".to_string(),
        })?;
        let c_path = CString::new(path).map_err(|_| TskError {
            code: 0,
            message: "Path contains an interior NUL byte".to_string(),
        })?;

        let raw = unsafe { tsk_sys::tsk_img_open_utf8_sing(c_path.as_ptr(), IMG_TYPE_DETECT, 0) };
        if raw.is_null() {
            return Err(last_tsk_error());
        }

        Ok(Self { raw })
    }
}

impl Drop for Image {
    fn drop(&mut self) {
        if !self.raw.is_null() {
            unsafe { tsk_sys::tsk_img_close(self.raw) };
        }
    }
}

pub struct Fs {
    _img: Image,
    fs: *mut tsk_sys::TSK_FS_INFO,
}

impl Fs {
    pub fn open(image_path: &Path, offset: i64) -> Result<Self, TskError> {
        let img = Image::open(image_path)?;
        let fs = unsafe {
            tsk_sys::tsk_fs_open_img(img.raw, offset as tsk_sys::TSK_OFF_T, FS_TYPE_DETECT)
        };
        if fs.is_null() {
            return Err(last_tsk_error());
        }
        Ok(Self { _img: img, fs })
    }

    pub fn list_dir(&self, path: &str) -> Result<Vec<DirEntry>, TskError> {
        let c_path = CString::new(path).map_err(|_| TskError {
            code: 0,
            message: "Path contains an interior NUL byte".to_string(),
        })?;

        let dir = unsafe { tsk_sys::tsk_fs_dir_open(self.fs, c_path.as_ptr()) };
        if dir.is_null() {
            return Err(last_tsk_error());
        }

        let entries = unsafe { read_dir_entries_from_open_dir(dir) };

        unsafe { tsk_sys::tsk_fs_dir_close(dir) };
        Ok(entries)
    }
}

impl Drop for Fs {
    fn drop(&mut self) {
        if !self.fs.is_null() {
            unsafe { tsk_sys::tsk_fs_close(self.fs) };
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub meta_addr: u64,
    pub is_dir: bool,
}
