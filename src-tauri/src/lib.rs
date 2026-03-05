pub mod tsk;
pub mod tsk_sys;
pub mod postgres;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

fn hex_backend_log_path() -> PathBuf {
    std::env::temp_dir().join("rustsk_hex_backend.log")
}

fn append_hex_backend_log(
    image_path: &str,
    offset: i64,
    path: &str,
    requested_max: usize,
    bytes: &[u8],
) {
    let log_path = hex_backend_log_path();
    let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path) else {
        return;
    };

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|dur| dur.as_secs().to_string())
        .unwrap_or_else(|_| "unknown-ts".to_string());

    let _ = writeln!(
        file,
        "\n===== read_file_bytes {timestamp} =====\nimage_path: {image_path}\noffset: {offset}\npath: {path}\nrequested_max: {requested_max}\nreturned_len: {}\nlog_file: {}",
        bytes.len(),
        log_path.display()
    );

    for (row_index, chunk) in bytes.chunks(16).enumerate() {
        let base = row_index * 16;
        let mut hex = String::new();
        for byte in chunk {
            let _ = std::fmt::Write::write_fmt(&mut hex, format_args!("{byte:02X} "));
        }
        for _ in chunk.len()..16 {
            hex.push_str("   ");
        }

        let ascii: String = chunk
            .iter()
            .map(|b| {
                let c = *b as char;
                if c.is_ascii_graphic() || c == ' ' {
                    c
                } else {
                    '.'
                }
            })
            .collect();

        let _ = writeln!(file, "{base:08X}: {hex}|{ascii}|");
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn list_dir(image_path: String, offset: i64, path: String) -> Result<Vec<tsk::DirEntry>, String> {
    let fs = tsk::Fs::open(std::path::Path::new(&image_path), offset)
        .map_err(|err| err.to_string())?;
    fs.list_dir(&path).map_err(|err| err.to_string())
}

#[tauri::command]
fn discover_disk_image_tree(image_path: String) -> Result<tsk::DataSourceTree, String> {
    tsk::discover_data_source_tree(std::path::Path::new(&image_path)).map_err(|err| err.to_string())
}

#[tauri::command]
fn read_file_bytes(
    image_path: String,
    offset: i64,
    path: String,
    max_bytes: Option<usize>,
) -> Result<Vec<u8>, String> {
    let requested_max = max_bytes.unwrap_or(1024 * 1024);
    let fs = tsk::Fs::open(std::path::Path::new(&image_path), offset)
        .map_err(|err| err.to_string())?;
    let bytes = fs
        .read_file(&path, requested_max)
        .map_err(|err| err.to_string())?;
    append_hex_backend_log(&image_path, offset, &path, requested_max, &bytes);
    Ok(bytes)
}

#[tauri::command]
fn read_file_strings(
    image_path: String,
    offset: i64,
    path: String,
    min_length: Option<usize>,
    max_bytes: Option<usize>,
    max_strings: Option<usize>,
) -> Result<tsk::StringsResult, String> {
    let fs = tsk::Fs::open(std::path::Path::new(&image_path), offset)
        .map_err(|err| err.to_string())?;
    fs.extract_ascii_strings(
        &path,
        min_length.unwrap_or(4),
        max_bytes.unwrap_or(8 * 1024 * 1024),
        max_strings.unwrap_or(50_000),
    )
    .map_err(|err| err.to_string())
}

#[tauri::command]
fn read_path_metadata(
    image_path: String,
    offset: i64,
    path: String,
) -> Result<tsk::PathMetadata, String> {
    let fs = tsk::Fs::open(std::path::Path::new(&image_path), offset)
        .map_err(|err| err.to_string())?;
    fs.read_path_metadata(&path).map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            let _ = std::thread::Builder::new()
                .name("embedded-postgres-startup".to_string())
                .spawn(move || {
                    if let Err(err) = postgres::start_embedded_postgres(&app_handle) {
                        eprintln!("failed to start embedded postgres: {err}");
                    }
                });
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            list_dir,
            discover_disk_image_tree,
            read_file_bytes,
            read_file_strings,
            read_path_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
