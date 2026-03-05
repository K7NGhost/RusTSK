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
const FS_FILE_READ_FLAG_NONE: tsk_sys::TSK_FS_FILE_READ_FLAG_ENUM =
    tsk_sys::TSK_FS_FILE_READ_FLAG_ENUM_TSK_FS_FILE_READ_FLAG_NONE;
const FS_FILE_READ_FLAG_NOID: tsk_sys::TSK_FS_FILE_READ_FLAG_ENUM =
    tsk_sys::TSK_FS_FILE_READ_FLAG_ENUM_TSK_FS_FILE_READ_FLAG_NOID;
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

fn is_strings_printable_ascii(byte: u8) -> bool {
    byte.is_ascii_graphic() || byte == b' ' || byte == b'\t'
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

#[derive(Debug, Clone, Serialize)]
pub struct ExtractedString {
    pub offset: u64,
    pub value: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StringsResult {
    pub strings: Vec<ExtractedString>,
    pub scanned_bytes: usize,
    pub truncated: bool,
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

    pub fn read_file(&self, path: &str, max_bytes: usize) -> Result<Vec<u8>, TskError> {
        let c_path = CString::new(path).map_err(|_| TskError {
            code: 0,
            message: "Path contains an interior NUL byte".to_string(),
        })?;

        let fs_file = unsafe { tsk_sys::tsk_fs_file_open(self.fs, std::ptr::null_mut(), c_path.as_ptr()) };
        if fs_file.is_null() {
            return Err(last_tsk_error());
        }

        if max_bytes == 0 {
            unsafe { tsk_sys::tsk_fs_file_close(fs_file) };
            return Ok(Vec::new());
        }

        let mut out = Vec::new();
        out.reserve(max_bytes.min(64 * 1024));
        let mut offset: i64 = 0;
        let read_flags = FS_FILE_READ_FLAG_NONE | FS_FILE_READ_FLAG_NOID;

        loop {
            if out.len() >= max_bytes {
                break;
            }

            let remaining = max_bytes - out.len();
            let chunk_len = remaining.min(64 * 1024);
            let mut chunk = vec![0_u8; chunk_len];
            let read_res = unsafe {
                tsk_sys::tsk_fs_file_read(
                    fs_file,
                    offset,
                    chunk.as_mut_ptr() as *mut std::os::raw::c_char,
                    chunk_len,
                    read_flags,
                )
            };

            if read_res < 0 {
                let err = last_tsk_error();
                if err.message.contains("Invalid file offset") {
                    break;
                }
                unsafe { tsk_sys::tsk_fs_file_close(fs_file) };
                return Err(err);
            }

            if read_res == 0 {
                break;
            }

            let read_usize = read_res as usize;
            out.extend_from_slice(&chunk[..read_usize]);
            offset += read_res as i64;
        }

        unsafe { tsk_sys::tsk_fs_file_close(fs_file) };
        Ok(out)
    }

    pub fn extract_ascii_strings(
        &self,
        path: &str,
        min_len: usize,
        max_bytes: usize,
        max_strings: usize,
    ) -> Result<StringsResult, TskError> {
        let c_path = CString::new(path).map_err(|_| TskError {
            code: 0,
            message: "Path contains an interior NUL byte".to_string(),
        })?;

        let fs_file =
            unsafe { tsk_sys::tsk_fs_file_open(self.fs, std::ptr::null_mut(), c_path.as_ptr()) };
        if fs_file.is_null() {
            return Err(last_tsk_error());
        }

        if max_bytes == 0 || max_strings == 0 {
            unsafe { tsk_sys::tsk_fs_file_close(fs_file) };
            return Ok(StringsResult {
                strings: Vec::new(),
                scanned_bytes: 0,
                truncated: false,
            });
        }

        let effective_min_len = min_len.max(1);
        let read_flags = FS_FILE_READ_FLAG_NONE | FS_FILE_READ_FLAG_NOID;
        const CHUNK_SIZE: usize = 256 * 1024;

        let mut strings = Vec::<ExtractedString>::new();
        let mut current = Vec::<u8>::new();
        let mut current_start: u64 = 0;
        let mut scanned_bytes: usize = 0;
        let mut file_offset: i64 = 0;
        let mut truncated = false;

        'read_loop: loop {
            if scanned_bytes >= max_bytes {
                truncated = true;
                break;
            }
            if strings.len() >= max_strings {
                truncated = true;
                break;
            }

            let remaining = max_bytes - scanned_bytes;
            let chunk_len = remaining.min(CHUNK_SIZE);
            if chunk_len == 0 {
                truncated = true;
                break;
            }

            let mut chunk = vec![0_u8; chunk_len];
            let read_res = unsafe {
                tsk_sys::tsk_fs_file_read(
                    fs_file,
                    file_offset,
                    chunk.as_mut_ptr() as *mut std::os::raw::c_char,
                    chunk_len,
                    read_flags,
                )
            };

            if read_res < 0 {
                let err = last_tsk_error();
                if err.message.contains("Invalid file offset") {
                    break;
                }
                unsafe { tsk_sys::tsk_fs_file_close(fs_file) };
                return Err(err);
            }

            if read_res == 0 {
                break;
            }

            let read_usize = read_res as usize;
            let chunk_offset_start = file_offset as u64;

            for (index, byte) in chunk[..read_usize].iter().enumerate() {
                if is_strings_printable_ascii(*byte) {
                    if current.is_empty() {
                        current_start = chunk_offset_start + index as u64;
                    }
                    current.push(*byte);
                    continue;
                }

                if current.len() >= effective_min_len {
                    strings.push(ExtractedString {
                        offset: current_start,
                        value: String::from_utf8_lossy(&current).into_owned(),
                    });
                    if strings.len() >= max_strings {
                        truncated = true;
                        current.clear();
                        break 'read_loop;
                    }
                }
                current.clear();
            }

            scanned_bytes += read_usize;
            file_offset += read_res as i64;
        }

        if current.len() >= effective_min_len && strings.len() < max_strings {
            strings.push(ExtractedString {
                offset: current_start,
                value: String::from_utf8_lossy(&current).into_owned(),
            });
        } else if current.len() >= effective_min_len && strings.len() >= max_strings {
            truncated = true;
        }

        unsafe { tsk_sys::tsk_fs_file_close(fs_file) };

        Ok(StringsResult {
            strings,
            scanned_bytes,
            truncated,
        })
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
