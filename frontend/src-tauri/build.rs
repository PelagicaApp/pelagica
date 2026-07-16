use std::path::PathBuf;

fn main() {
    tauri_build::build();

    // `cargo tauri dev`/`cargo build` run the binary straight out of the target
    // profile dir, without the bundler step that normally copies `bundle.resources`
    // next to it. tauri-plugin-libmpv looks for `libmpv-wrapper` in `<exe_dir>/lib`,
    // so mirror `lib/` (populated by `npx tauri-plugin-libmpv-api setup-lib`) there too.
    let manifest_dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let lib_dir = manifest_dir.join("lib");
    if !lib_dir.exists() {
        return;
    }

    let out_dir = PathBuf::from(std::env::var("OUT_DIR").unwrap());
    // OUT_DIR is `<profile_dir>/build/<pkg>-<hash>/out`.
    let profile_dir = out_dir
        .ancestors()
        .nth(3)
        .expect("failed to resolve target profile directory from OUT_DIR");

    let dest_dir = profile_dir.join("lib");
    std::fs::create_dir_all(&dest_dir).expect("failed to create lib dir next to executable");

    for entry in std::fs::read_dir(&lib_dir).expect("failed to read src-tauri/lib") {
        let entry = entry.expect("failed to read src-tauri/lib entry");
        let dest = dest_dir.join(entry.file_name());

        // Source files copied from Homebrew's Cellar (e.g. libmpv.dylib) are
        // read-only; fs::copy propagates that onto the destination, which then
        // fails to be overwritten on the next build. Drop any previous copy first.
        let _ = std::fs::remove_file(&dest);
        std::fs::copy(entry.path(), &dest).expect("failed to copy native library next to executable");

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&dest, std::fs::Permissions::from_mode(0o755))
                .expect("failed to make copied native library writable");
        }
    }

    println!("cargo:rerun-if-changed=lib");
}
