pub mod tsk;
pub mod tsk_sys;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn list_dir(image_path: String, offset: i64, path: String) -> Result<Vec<tsk::DirEntry>, String> {
    let fs = tsk::Fs::open(std::path::Path::new(&image_path), offset)
        .map_err(|err| err.to_string())?;
    fs.list_dir(&path).map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
