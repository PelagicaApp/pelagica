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
