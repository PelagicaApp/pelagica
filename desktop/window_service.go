package main

import "github.com/wailsapp/wails/v3/pkg/application"

// trafficLightLeftInset should match the TopBar's fake pill left inset in TopBar.tsx.
const trafficLightLeftInset = 20.0

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
	s.positionTrafficLights()
}

// positionTrafficLights aligns the traffic lights with the TopBar's pill row. AppKit resets
// their position on resize and when re-enabled, so this must be re-invoked after both.
// NSWindow/NSView geometry may only be touched on the main thread, so this must run through
// InvokeSync rather than being called directly from a background goroutine (e.g. an event hook).
func (s *WindowService) positionTrafficLights() {
	application.InvokeSync(func() {
		positionTrafficLights(s.window.NativeWindow(), trafficLightLeftInset)
	})
}

// ToggleFullscreen toggles native window fullscreen.
func (s *WindowService) ToggleFullscreen() {
	s.window.ToggleFullscreen()
}

// Minimise minimises the window (used by the custom title bar on Windows/Linux).
func (s *WindowService) Minimise() {
	s.window.Minimise()
}

// ToggleMaximise toggles the window between maximised and normal size (used by the custom title bar on Windows/Linux).
func (s *WindowService) ToggleMaximise() {
	s.window.ToggleMaximise()
}

// IsMaximised reports whether the window is currently maximised.
func (s *WindowService) IsMaximised() bool {
	return s.window.IsMaximised()
}

// CloseWindow closes the window (used by the custom title bar on Windows/Linux).
func (s *WindowService) CloseWindow() {
	s.window.Close()
}

// IsFullscreen reports whether the window is currently fullscreen.
func (s *WindowService) IsFullscreen() bool {
	return s.window.IsFullscreen()
}
