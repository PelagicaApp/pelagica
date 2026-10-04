//go:build windows

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"syscall"
	"time"
)

type updateState struct {
	mu              sync.RWMutex
	Status          string `json:"status"` // idle, downloading, downloaded, installing, error
	Progress        int    `json:"progress"` // 0-100
	BytesDownloaded int64  `json:"bytesDownloaded"`
	TotalBytes      int64  `json:"totalBytes"`
	Error           string `json:"error,omitempty"`
	InstallerPath   string `json:"installerPath,omitempty"`
}

var currentUpdate = &updateState{
	Status: "idle",
}

type progressWriter struct {
	total      int64
	downloaded int64
	state      *updateState
}

func (pw *progressWriter) Write(p []byte) (int, error) {
	n := len(p)
	pw.downloaded += int64(n)
	pw.state.mu.Lock()
	pw.state.BytesDownloaded = pw.downloaded
	if pw.total > 0 {
		pw.state.Progress = int(float64(pw.downloaded) / float64(pw.total) * 100)
	}
	pw.state.mu.Unlock()
	return n, nil
}

type downloadRequest struct {
	URL     string `json:"url"`
	Version string `json:"version"`
}

func handleUpdateStatus(w http.ResponseWriter, r *http.Request) {
	currentUpdate.mu.RLock()
	defer currentUpdate.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"supported":       true,
		"platform":        "windows",
		"status":          currentUpdate.Status,
		"progress":        currentUpdate.Progress,
		"bytesDownloaded": currentUpdate.BytesDownloaded,
		"totalBytes":      currentUpdate.TotalBytes,
		"error":           currentUpdate.Error,
	})
}

func handleUpdateDownload(w http.ResponseWriter, r *http.Request) {
	var req downloadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.URL == "" {
		writeJSONError(w, http.StatusBadRequest, "Invalid request payload or missing URL")
		return
	}

	currentUpdate.mu.Lock()
	if currentUpdate.Status == "downloading" {
		currentUpdate.mu.Unlock()
		writeJSONError(w, http.StatusConflict, "Download is already in progress")
		return
	}
	currentUpdate.Status = "downloading"
	currentUpdate.Progress = 0
	currentUpdate.BytesDownloaded = 0
	currentUpdate.TotalBytes = 0
	currentUpdate.Error = ""
	currentUpdate.InstallerPath = ""
	currentUpdate.mu.Unlock()

	go func(downloadURL, version string) {
		tempDir := os.TempDir()
		fileName := fmt.Sprintf("Pelagica-Update-%s-Setup.exe", version)
		destPath := filepath.Join(tempDir, fileName)

		resp, err := http.Get(downloadURL)
		if err != nil {
			currentUpdate.mu.Lock()
			currentUpdate.Status = "error"
			currentUpdate.Error = fmt.Sprintf("Download failed: %v", err)
			currentUpdate.mu.Unlock()
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			currentUpdate.mu.Lock()
			currentUpdate.Status = "error"
			currentUpdate.Error = fmt.Sprintf("Server returned status %d", resp.StatusCode)
			currentUpdate.mu.Unlock()
			return
		}

		total := resp.ContentLength
		currentUpdate.mu.Lock()
		currentUpdate.TotalBytes = total
		currentUpdate.mu.Unlock()

		out, err := os.Create(destPath)
		if err != nil {
			currentUpdate.mu.Lock()
			currentUpdate.Status = "error"
			currentUpdate.Error = fmt.Sprintf("Failed to create file: %v", err)
			currentUpdate.mu.Unlock()
			return
		}
		defer out.Close()

		pw := &progressWriter{
			total: total,
			state: currentUpdate,
		}

		if _, err := io.Copy(out, io.TeeReader(resp.Body, pw)); err != nil {
			currentUpdate.mu.Lock()
			currentUpdate.Status = "error"
			currentUpdate.Error = fmt.Sprintf("Download interrupted: %v", err)
			currentUpdate.mu.Unlock()
			return
		}

		currentUpdate.mu.Lock()
		currentUpdate.Status = "downloaded"
		currentUpdate.Progress = 100
		currentUpdate.InstallerPath = destPath
		currentUpdate.mu.Unlock()
		log.Printf("Update installer downloaded successfully: %s", destPath)
	}(req.URL, req.Version)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message": "Download started",
		"status":  "downloading",
	})
}

func handleUpdateInstall(w http.ResponseWriter, r *http.Request) {
	currentUpdate.mu.Lock()
	installerPath := currentUpdate.InstallerPath
	if currentUpdate.Status != "downloaded" || installerPath == "" {
		currentUpdate.mu.Unlock()
		writeJSONError(w, http.StatusBadRequest, "No downloaded update is ready for installation")
		return
	}

	if _, err := os.Stat(installerPath); err != nil {
		currentUpdate.Status = "error"
		currentUpdate.Error = "Installer file not found on disk"
		currentUpdate.mu.Unlock()
		writeJSONError(w, http.StatusNotFound, "Installer file not found")
		return
	}

	currentUpdate.Status = "installing"
	currentUpdate.mu.Unlock()

	// Launch installer detached from current Pelagica process
	cmd := exec.Command(installerPath)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}

	if err := cmd.Start(); err != nil {
		currentUpdate.mu.Lock()
		currentUpdate.Status = "error"
		currentUpdate.Error = fmt.Sprintf("Failed to launch installer: %v", err)
		currentUpdate.mu.Unlock()
		writeJSONError(w, http.StatusInternalServerError, currentUpdate.Error)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"message": "Installer launched successfully. Pelagica is shutting down to allow installation.",
		"success": true,
	})

	// Terminate Pelagica shortly after replying to give installer free file access
	go func() {
		time.Sleep(1 * time.Second)
		os.Exit(0)
	}()
}

func registerUpdateRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/desktop/update/status", handleUpdateStatus)
	mux.HandleFunc("POST /api/desktop/update/download", handleUpdateDownload)
	mux.HandleFunc("POST /api/desktop/update/install", handleUpdateInstall)
}
