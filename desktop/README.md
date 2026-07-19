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

## Build an installer (macOS only)

```bash
task desktop:package     # produces desktop/bin/Pelagica.app
task desktop:installer   # also produces desktop/bin/Pelagica.dmg
```

The `.app` is ad-hoc codesigned (`codesign --sign -`) so it runs locally, but it isn't signed with a Developer ID or notarized, so Gatekeeper will still flag it for anyone else who downloads it (right-click -> Open bypasses this). The `.dmg` has the usual drag-to-Applications layout (built with [create-dmg](https://github.com/create-dmg/create-dmg): `brew install create-dmg`).
