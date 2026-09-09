package main

import (
	"encoding/json"
	"os"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

const (
	windowStateFileName = "window-state.json"
	// Coalesces a drag into one measurement, and lets the maximise or fullscreen
	// notification arrive first: the platform posts those after the resize they belong to.
	windowStateSettleDelay = time.Second
	minVisibleWidth        = 200
	minVisibleHeight       = 100
	windowStateEpsilon     = 1
)

// windowState carries the window's normal bounds between launches, never its maximised,
// fullscreen or minimised ones.
type windowState struct {
	X         int  `json:"x"`
	Y         int  `json:"y"`
	Width     int  `json:"width"`
	Height    int  `json:"height"`
	Maximised bool `json:"maximised"`
}

type windowStateTracker struct {
	window *application.WebviewWindow

	mu          sync.Mutex
	state       windowState
	maximised   bool
	fullscreen  bool
	minimised   bool
	dirty       bool
	settleTimer *time.Timer
}

func (t *windowStateTracker) applySavedState(options *application.WebviewWindowOptions) {
	saved, ok := loadWindowState()
	if !ok {
		return
	}
	t.state = saved
	// A restored window is maximised before any event says so.
	t.maximised = saved.Maximised

	options.Width = saved.Width
	options.Height = saved.Height
	options.X = saved.X
	options.Y = saved.Y
	options.InitialPosition = application.WindowXY
	if saved.Maximised {
		options.StartState = application.WindowStateMaximised
	}
}

func (t *windowStateTracker) registerHooks(window *application.WebviewWindow) {
	t.window = window

	window.RegisterHook(events.Common.WindowDidResize, func(*application.WindowEvent) { t.record() })
	window.RegisterHook(events.Common.WindowDidMove, func(*application.WindowEvent) { t.record() })

	window.RegisterHook(events.Common.WindowMaximise, func(*application.WindowEvent) { t.setMaximised(true) })
	window.RegisterHook(events.Common.WindowUnMaximise, func(*application.WindowEvent) { t.setMaximised(false) })
	window.RegisterHook(events.Common.WindowFullscreen, func(*application.WindowEvent) { t.setFlag(&t.fullscreen, true) })
	window.RegisterHook(events.Common.WindowUnFullscreen, func(*application.WindowEvent) { t.setFlag(&t.fullscreen, false) })
	window.RegisterHook(events.Common.WindowMinimise, func(*application.WindowEvent) { t.setFlag(&t.minimised, true) })
	window.RegisterHook(events.Common.WindowUnMinimise, func(*application.WindowEvent) { t.setFlag(&t.minimised, false) })
}

func (t *windowStateTracker) record() {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.scheduleSettleLocked()
}

// Must be called with the lock held.
func (t *windowStateTracker) scheduleSettleLocked() {
	if t.settleTimer != nil {
		t.settleTimer.Stop()
	}
	t.settleTimer = time.AfterFunc(windowStateSettleDelay, func() { t.settle() })
}

func (t *windowStateTracker) settle() {
	t.mu.Lock()
	window := t.window
	skip := window == nil || t.maximised || t.fullscreen || t.minimised
	t.settleTimer = nil
	t.mu.Unlock()

	if !skip {
		// Bounds() hops onto the main thread, so it must not run under the lock.
		if bounds := window.Bounds(); bounds.Width > 0 && bounds.Height > 0 {
			t.mu.Lock()
			if !withinEpsilon(bounds, t.state) {
				t.state.X = bounds.X
				t.state.Y = bounds.Y
				t.state.Width = bounds.Width
				t.state.Height = bounds.Height
				t.dirty = true
			}
			t.mu.Unlock()
		}
	}

	t.write()
}

// withinEpsilon absorbs the rounding a read-back applies to the stored geometry.
func withinEpsilon(bounds application.Rect, state windowState) bool {
	return abs(bounds.X-state.X) <= windowStateEpsilon &&
		abs(bounds.Y-state.Y) <= windowStateEpsilon &&
		abs(bounds.Width-state.Width) <= windowStateEpsilon &&
		abs(bounds.Height-state.Height) <= windowStateEpsilon
}

func abs(v int) int {
	if v < 0 {
		return -v
	}
	return v
}

func (t *windowStateTracker) setMaximised(maximised bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.maximised = maximised
	t.state.Maximised = maximised
	t.dirty = true
	t.scheduleSettleLocked()
}

func (t *windowStateTracker) setFlag(flag *bool, value bool) {
	t.mu.Lock()
	defer t.mu.Unlock()
	*flag = value
}

// flush measures and writes anything pending, for a quit inside the settle delay.
func (t *windowStateTracker) flush() {
	t.mu.Lock()
	pending := t.settleTimer != nil
	if pending {
		t.settleTimer.Stop()
		t.settleTimer = nil
	}
	t.mu.Unlock()

	if pending {
		t.settle()
		return
	}
	t.write()
}

func (t *windowStateTracker) write() {
	t.mu.Lock()
	if !t.dirty {
		t.mu.Unlock()
		return
	}
	t.dirty = false
	state := t.state
	t.mu.Unlock()

	saveWindowState(state)
}

// ensureWindowOnScreen brings a restored window back onto a connected display.
func ensureWindowOnScreen(app *application.App, window *application.WebviewWindow) {
	bounds := window.Bounds()
	if bounds.Width <= 0 || bounds.Height <= 0 {
		return
	}

	screens := app.Screen.GetAll()
	if len(screens) == 0 {
		return
	}

	area, visible := hostScreen(bounds, screens)

	// Geometry from a larger display would hang off this one, putting the player controls
	// out of reach.
	width := min(bounds.Width, area.Width)
	height := min(bounds.Height, area.Height)
	if width != bounds.Width || height != bounds.Height {
		window.SetSize(width, height)
		visible = false
	}

	if !visible {
		window.Center()
	}
}

func hostScreen(bounds application.Rect, screens []*application.Screen) (application.Rect, bool) {
	for _, screen := range screens {
		if isUsablyVisible(bounds, screen.WorkArea) {
			return screen.WorkArea, true
		}
	}
	return screens[0].WorkArea, false
}

// isUsablyVisible reports whether enough overlaps for the user to grab the window back.
func isUsablyVisible(bounds, area application.Rect) bool {
	overlapWidth := min(bounds.X+bounds.Width, area.X+area.Width) - max(bounds.X, area.X)
	overlapHeight := min(bounds.Y+bounds.Height, area.Y+area.Height) - max(bounds.Y, area.Y)
	return overlapWidth >= minVisibleWidth && overlapHeight >= minVisibleHeight
}

func loadWindowState() (windowState, bool) {
	path, err := configFilePath(windowStateFileName)
	if err != nil {
		return windowState{}, false
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return windowState{}, false
	}
	var state windowState
	if err := json.Unmarshal(data, &state); err != nil {
		return windowState{}, false
	}
	if state.Width < windowMinWidth || state.Height < windowMinHeight {
		return windowState{}, false
	}
	return state, true
}

func saveWindowState(state windowState) {
	path, err := configFilePath(windowStateFileName)
	if err != nil {
		return
	}
	data, err := json.Marshal(state)
	if err != nil {
		return
	}
	_ = os.WriteFile(path, data, 0o644)
}
