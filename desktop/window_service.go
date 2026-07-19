package main

import "github.com/wailsapp/wails/v3/pkg/application"

// WindowService exposes window chrome controls to the frontend.
type WindowService struct {
	window *application.WebviewWindow
}

// HideTrafficLights hides the macOS traffic light window buttons (no-op on other platforms).
func (s *WindowService) HideTrafficLights() {
	s.window.SetCloseButtonState(application.ButtonHidden)
	s.window.SetMinimiseButtonState(application.ButtonHidden)
	s.window.SetMaximiseButtonState(application.ButtonHidden)
}

// ShowTrafficLights restores the macOS traffic light window buttons (no-op on other platforms).
func (s *WindowService) ShowTrafficLights() {
	s.window.SetCloseButtonState(application.ButtonEnabled)
	s.window.SetMinimiseButtonState(application.ButtonEnabled)
	s.window.SetMaximiseButtonState(application.ButtonEnabled)
}

// ToggleFullscreen toggles native window fullscreen.
func (s *WindowService) ToggleFullscreen() {
	s.window.ToggleFullscreen()
}

// IsFullscreen reports whether the window is currently fullscreen.
func (s *WindowService) IsFullscreen() bool {
	return s.window.IsFullscreen()
}
