# Pelagica Desktop

A native desktop shell for Pelagica built with [Wails v3](https://v3.wails.io), additional to the existing web app.

## Prerequisites

- Go 1.25+
- pnpm (used to build `../frontend`)

Run everything through the root [Taskfile.yml](../Taskfile.yml) (`task <name>`, requires [go-task](https://taskfile.dev)).

## Run it

```bash
task desktop
```

This builds `../frontend` for production, copies `frontend/dist` into `desktop/frontend/dist` (gitignored, regenerated on every run), and starts the app with `go run .`. Re-run it after any frontend change, since the frontend is embedded into the binary at build time.

## Build a binary

```bash
task desktop:build
```

Produces `desktop/bin/pelagica`.

## Build an installer (macOS)

```bash
task desktop:package:macos     # produces desktop/bin/Pelagica.app
task desktop:installer:macos   # also produces desktop/bin/Pelagica.dmg
```

The `.app` is ad-hoc codesigned (`codesign --sign -`) so it runs locally, but it isn't signed with a Developer ID or notarized, so Gatekeeper will still flag it for anyone else who downloads it (right-click -> Open bypasses this). The `.dmg` has the usual drag-to-Applications layout (built with [create-dmg](https://github.com/create-dmg/create-dmg): `brew install create-dmg`).

## Build an installer (Windows)

```bash
task desktop:package:windows     # produces desktop/bin/pelagica.exe
task desktop:installer:windows   # also produces desktop/bin/Pelagica-amd64-installer.exe
```

The `.exe` has the app icon and version info embedded via a generated `.syso` resource file. The installer is an NSIS setup built with [NSIS](https://nsis.sourceforge.io/) (`winget install NSIS.NSIS`, or `choco install nsis`); on first run it also downloads the Microsoft Edge WebView2 bootstrapper into `build/windows/nsis/` so the installer can provision the WebView2 Runtime on machines that don't already have it. It isn't signed with an Authenticode certificate, so Windows SmartScreen will flag it for anyone else who downloads it.

## Build an installer (Linux)

```bash
task desktop:package:linux             # produces desktop/bin/pelagica
task desktop:installer:linux:deb       # also produces desktop/bin/pelagica.deb
task desktop:installer:linux:appimage  # also produces desktop/bin/pelagica-x86_64.AppImage
```

Building requires a C compiler and the GTK4 + WebKitGTK 6.0 dev headers (Ubuntu/Debian: `apt install build-essential pkg-config libgtk-4-dev libwebkitgtk-6.0-dev`), since the Linux build uses cgo. The `.deb` is built with nfpm (bundled in the `wails3` CLI, no separate install needed) from [build/linux/nfpm/nfpm.yaml](build/linux/nfpm/nfpm.yaml), and depends on `libgtk-4-1`/`libwebkitgtk-6.0-4` at install time. The AppImage is built via `wails3 generate appimage`, which downloads [linuxdeploy](https://github.com/linuxdeploy/linuxdeploy) on first run. Neither package is signed.
