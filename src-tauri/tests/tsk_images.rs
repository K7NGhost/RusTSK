use std::path::PathBuf;

use rustsk_lib::tsk::Fs;

fn test_image_path() -> PathBuf {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push("tests");
    path.push("data");
    path.push("image.dd");
    path
}

#[test]
fn open_image_and_list_root() {
    let image_path = test_image_path();
    let fs = Fs::open(&image_path, 0).expect("open fs from test image");
    let entries = fs.list_dir("/").expect("list root directory");

    println!("Root entries ({}):", entries.len());
    let names: Vec<String> = entries
        .into_iter()
        .map(|e| {
            println!("- {}{}", e.name, if e.is_dir { "/" } else { "" });
            e.name
        })
        .collect();

    assert!(names.contains(&"lost+found".to_string()));
    assert!(names.contains(&"a_directory".to_string()));
    assert!(names.contains(&"passwords.txt".to_string()));
}
