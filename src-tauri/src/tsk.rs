use std::ffi::{CStr, CString};
use std::path::Path;

use serde::Serialize;

use crate::tsk_sys;

const IMG_TYPE_DETECT: tsk_sys::TSK_IMG_TYPE_ENUM =
    tsk_sys::TSK_IMG_TYPE_ENUM_TSK_IMG_TYPE_DETECT;
const FS_TYPE_DETECT: tsk_sys::TSK_FS_TYPE_ENUM =
    tsk_sys::TSK_FS_TYPE_ENUM_TSK_FS_TYPE_DETECT;
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

        let raw = unsafe {
            tsk_sys::tsk_img_open_utf8_sing(
                c_path.as_ptr(),
                IMG_TYPE_DETECT,
                0,
            )
        };
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
            tsk_sys::tsk_fs_open_img(
                img.raw,
                offset as tsk_sys::TSK_OFF_T,
                FS_TYPE_DETECT,
            )
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
            let is_dir = name_ref.type_ == FS_NAME_TYPE_DIR || name_ref.type_ == FS_NAME_TYPE_VIRT_DIR;

            entries.push(DirEntry {
                name,
                meta_addr: name_ref.meta_addr,
                is_dir,
            });
        }

        unsafe { tsk_sys::tsk_fs_dir_close(dir) };
        Ok(entries)
    }

    pub fn list_dir_tree(
        &self,
        root_path: &str,
        max_depth: usize,
        max_entries: usize,
    ) -> Result<DirTreeNode, TskError> {
        let normalized_root = if root_path.trim().is_empty() {
            "/"
        } else {
            root_path
        };
        let mut visited = 0usize;
        self.build_tree_recursive(normalized_root, 0, max_depth, max_entries, &mut visited)
    }

    fn build_tree_recursive(
        &self,
        current_path: &str,
        depth: usize,
        max_depth: usize,
        max_entries: usize,
        visited: &mut usize,
    ) -> Result<DirTreeNode, TskError> {
        let mut node = DirTreeNode {
            name: path_name(current_path),
            path: current_path.to_string(),
            is_dir: true,
            children: Vec::new(),
        };

        if depth >= max_depth || *visited >= max_entries {
            return Ok(node);
        }

        let entries = self.list_dir(current_path)?;
        for entry in entries {
            if entry.name == "." || entry.name == ".." {
                continue;
            }
            if *visited >= max_entries {
                break;
            }
            *visited += 1;

            let child_path = join_fs_path(current_path, &entry.name);
            if entry.is_dir {
                match self.build_tree_recursive(
                    &child_path,
                    depth + 1,
                    max_depth,
                    max_entries,
                    visited,
                ) {
                    Ok(mut child) => {
                        child.name = entry.name;
                        child.path = child_path;
                        child.is_dir = true;
                        node.children.push(child);
                    }
                    Err(_) => {
                        // Keep the directory visible even if traversal fails deeper.
                        node.children.push(DirTreeNode {
                            name: entry.name,
                            path: child_path,
                            is_dir: true,
                            children: Vec::new(),
                        });
                    }
                }
            } else {
                node.children.push(DirTreeNode {
                    name: entry.name,
                    path: child_path,
                    is_dir: false,
                    children: Vec::new(),
                });
            }
        }

        Ok(node)
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

#[derive(Debug, Clone, Serialize)]
pub struct DirTreeNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Vec<DirTreeNode>,
}

fn join_fs_path(parent: &str, child: &str) -> String {
    if parent == "/" {
        format!("/{}", child)
    } else {
        format!("{}/{}", parent.trim_end_matches('/'), child)
    }
}

fn path_name(path: &str) -> String {
    if path == "/" {
        "/".to_string()
    } else {
        path.trim_end_matches('/')
            .rsplit('/')
            .next()
            .unwrap_or(path)
            .to_string()
    }
}
