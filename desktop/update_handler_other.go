//go:build !windows

package main

import (
	"encoding/json"
	"net/http"
)

func registerUpdateRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/desktop/update/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"supported": false,
			"platform":  "other",
			"status":    "unsupported",
		})
	})
	mux.HandleFunc("POST /api/desktop/update/download", func(w http.ResponseWriter, r *http.Request) {
		writeJSONError(w, http.StatusNotImplemented, "Auto-update is currently supported only on Windows Desktop")
	})
	mux.HandleFunc("POST /api/desktop/update/install", func(w http.ResponseWriter, r *http.Request) {
		writeJSONError(w, http.StatusNotImplemented, "Auto-update is currently supported only on Windows Desktop")
	})
}
