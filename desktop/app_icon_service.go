package main

import (
	"embed"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed appicons/*.icns
var appIconAssets embed.FS

var appIconOrder = []string{"classic", "classic_light", "pride", "pride_light"}

const defaultAppIcon = "classic"

// AppIconService lets the frontend list, read, and change the desktop app's Dock icon.
type AppIconService struct{}

// GetAppIconOptions returns the available icon names, in display order.
func (s *AppIconService) GetAppIconOptions() []string {
	return appIconOrder
}

// GetAppIcon returns the currently selected icon name.
func (s *AppIconService) GetAppIcon() string {
	name, err := readAppIconPreference()
	if err != nil || !isValidAppIcon(name) {
		return defaultAppIcon
	}
	return name
}

// SetAppIcon changes the Dock icon and persists the choice for future launches.
func (s *AppIconService) SetAppIcon(name string) {
	if !isValidAppIcon(name) {
		return
	}
	applyAppIcon(name)
	_ = writeAppIconPreference(name)
}

func isValidAppIcon(name string) bool {
	for _, n := range appIconOrder {
		if n == name {
			return true
		}
	}
	return false
}

// applyAppIcon sets the Dock icon. NSApplication.applicationIconImage may only be set on the
// main thread, so this must run through InvokeSync rather than being called directly from a
// background goroutine (e.g. a bound RPC method call).
func applyAppIcon(name string) {
	data, err := appIconAssets.ReadFile("appicons/" + name + ".icns")
	if err != nil {
		return
	}
	application.InvokeSync(func() {
		setApplicationIconFromICNS(data)
	})
}

// applySavedAppIcon re-applies the persisted icon choice; call once the window is shown.
func applySavedAppIcon() {
	name, err := readAppIconPreference()
	if err != nil || !isValidAppIcon(name) {
		return
	}
	applyAppIcon(name)
}

func appIconPreferencePath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir = filepath.Join(dir, "Pelagica")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "app-icon.txt"), nil
}

func readAppIconPreference() (string, error) {
	path, err := appIconPreferencePath()
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(data)), nil
}

func writeAppIconPreference(name string) error {
	path, err := appIconPreferencePath()
	if err != nil {
		return err
	}
	return os.WriteFile(path, []byte(name), 0o644)
}
