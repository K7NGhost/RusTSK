pub mod tsk;
pub mod tsk_sys;
pub mod postgres;

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
        .invoke_handler(tauri::generate_handler![list_dir, discover_disk_image_tree])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
