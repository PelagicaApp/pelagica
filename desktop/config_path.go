package main

import (
	"os"
	"path/filepath"
)

// configFilePath returns a path in the app's per-user config directory, creating it if needed.
func configFilePath(name string) (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir = filepath.Join(dir, "Pelagica")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(dir, name), nil
}
