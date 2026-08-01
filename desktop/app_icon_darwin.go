//go:build darwin

package main

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa
#import <Cocoa/Cocoa.h>

static void setApplicationIconFromICNS(const void* bytes, int length) {
    NSData* data = [NSData dataWithBytes:bytes length:length];
    NSImage* image = [[NSImage alloc] initWithData:data];
    if (image != nil) {
        [NSApplication sharedApplication].applicationIconImage = image;
    }
}
*/
import "C"
import "unsafe"

func setApplicationIconFromICNS(data []byte) {
	if len(data) == 0 {
		return
	}
	C.setApplicationIconFromICNS(unsafe.Pointer(&data[0]), C.int(len(data)))
}
