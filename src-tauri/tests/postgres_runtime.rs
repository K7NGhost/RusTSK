use rustsk_lib::postgres;

#[test]
fn postgres_runtime_files_are_present() {
    let root = postgres::dev_runtime_root();

    for rel in postgres::required_runtime_paths() {
        let path = root.join(rel);
        assert!(path.exists(), "missing postgres runtime file: {}", path.display());
    }
}

#[test]
fn postgres_connection_url_uses_embedded_port() {
    assert_eq!(
        postgres::postgres_connection_url(),
        "postgresql://postgres@127.0.0.1:55432/postgres"
    );
}
