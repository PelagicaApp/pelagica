//go:build !darwin

package main

import "unsafe"

func positionTrafficLights(nsWindow unsafe.Pointer, leftInset float64) {}
