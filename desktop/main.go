package main

import (
	"embed"
	"log"
	"net/http"
	"runtime"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

const (
	windowMinWidth  = 640
	windowMinHeight = 480
)

func newAssetHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/studios/{name}/logo", handleStudioLogo)
	registerSeerRoutes(mux)
	mux.Handle("/", application.AssetFileServerFS(assets))
	return mux
}

func main() {
	initStudiosDB()

	windowService := &WindowService{}
	appIconService := &AppIconService{}
	stateTracker := &windowStateTracker{}

	app := application.New(application.Options{
		Name:        "Pelagica",
		Description: "A modern cross-platform desktop client for Jellyfin",
		Services: []application.Service{
			application.NewService(windowService),
			application.NewService(appIconService),
		},
		Assets: application.AssetOptions{
			Handler: newAssetHandler(),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		OnShutdown: stateTracker.flush,
	})

	windowOptions := application.WebviewWindowOptions{
		Title:     "Pelagica",
		Width:     1280,
		Height:    800,
		MinWidth:  windowMinWidth,
		MinHeight: windowMinHeight,
		URL:       "/",
		Frameless: runtime.GOOS != "darwin", // macOS keeps framed, it's just inset so traggic light stays there
		Mac: application.MacWindow{
			TitleBar:                application.MacTitleBarHiddenInset,
			InvisibleTitleBarHeight: 50,
			WebviewPreferences: application.MacWebviewPreferences{
				FullscreenEnabled: application.Enabled,
			},
		},
	}
	stateTracker.applySavedState(&windowOptions)

	window := app.Window.NewWithOptions(windowOptions)
	windowService.window = window
	stateTracker.registerHooks(window)

	var onFirstShow sync.Once
	window.RegisterHook(events.Common.WindowShow, func(*application.WindowEvent) {
		windowService.positionTrafficLights()
		applySavedAppIcon()
		onFirstShow.Do(func() { ensureWindowOnScreen(app, window) })
	})
	window.RegisterHook(events.Common.WindowDidResize, func(*application.WindowEvent) {
		windowService.positionTrafficLights()
	})

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
