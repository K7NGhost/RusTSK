# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Cross-platform backend validation

Linux and macOS backend builds/tests are validated in CI via:

- [.github/workflows/cross-platform-tauri-backend.yml](.github/workflows/cross-platform-tauri-backend.yml)

The workflow runs `cargo test -- --nocapture` in `src-tauri` on Ubuntu and macOS with required native dependencies installed.

## Backend case service (PostgreSQL)

The Tauri backend now initializes PostgreSQL on app startup and runs SQL migrations from `src-tauri/migrations`.

- Optional env var: `RUSTSK_DATABASE_URL`
- Default URL if unset: `postgres://postgres:postgres@localhost:5432/rustsk`

Implemented Tauri commands:

- `create_case(name, description?)`
- `list_cases()`
- `open_case(case_id)`
- `add_evidence_source(case_id, source_type, display_name, path, offset?, sha256?)`
