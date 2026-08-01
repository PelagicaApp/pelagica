//go:build darwin

package main

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa
#import <Cocoa/Cocoa.h>

// Repositions the traffic light buttons, with their left edge at leftInset and vertically
// centered within their actual container view (NOT the full window - setFrameOrigin: is
// relative to the button's superview, which is the much shorter titlebar/toolbar container).
// AppKit resets this on window resize, so callers must re-invoke on WindowDidResize.
static void positionTrafficLights(void* nsWindowPtr, double leftInset) {
    NSWindow* window = (__bridge NSWindow*)nsWindowPtr;

    NSButton* close = [window standardWindowButton:NSWindowCloseButton];
    NSButton* miniaturize = [window standardWindowButton:NSWindowMiniaturizeButton];
    NSButton* zoom = [window standardWindowButton:NSWindowZoomButton];
    if (close == nil || miniaturize == nil || zoom == nil) {
        return;
    }

    NSView* container = close.superview;
    if (container == nil) {
        return;
    }

    CGFloat spacing = miniaturize.frame.origin.x - close.frame.origin.x;
    CGFloat buttonHeight = close.frame.size.height;
    CGFloat containerHeight = container.frame.size.height;
    CGFloat y = (containerHeight - buttonHeight) / 2.0;

    [close setFrameOrigin:NSMakePoint(leftInset, y)];
    [miniaturize setFrameOrigin:NSMakePoint(leftInset + spacing, y)];
    [zoom setFrameOrigin:NSMakePoint(leftInset + spacing * 2, y)];
}
*/
import "C"
import "unsafe"

func positionTrafficLights(nsWindow unsafe.Pointer, leftInset float64) {
	C.positionTrafficLights(nsWindow, C.double(leftInset))
}
