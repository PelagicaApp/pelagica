package main

import (
	"embed"
	"log"
	"runtime"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	windowService := &WindowService{}
	appIconService := &AppIconService{}

	app := application.New(application.Options{
		Name:        "Pelagica",
		Description: "A modern cross-platform desktop client for Jellyfin",
		Services: []application.Service{
			application.NewService(windowService),
			application.NewService(appIconService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:     "Pelagica",
		Width:     1280,
		Height:    800,
		URL:       "/",
		Frameless: runtime.GOOS != "darwin", // macOS keeps framed, it's just inset so traggic light stays there
		Mac: application.MacWindow{
			TitleBar:                application.MacTitleBarHiddenInset,
			InvisibleTitleBarHeight: 50,
			WebviewPreferences: application.MacWebviewPreferences{
				FullscreenEnabled: application.Enabled,
			},
		},
	})
	windowService.window = window

	window.RegisterHook(events.Common.WindowShow, func(*application.WindowEvent) {
		windowService.positionTrafficLights()
		applySavedAppIcon()
	})
	window.RegisterHook(events.Common.WindowDidResize, func(*application.WindowEvent) {
		windowService.positionTrafficLights()
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
