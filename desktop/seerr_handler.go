package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const (
	seerRequestTimeout = 15 * time.Second
	seerConfigCacheTTL = 30 * time.Second
)

type pelagicaPluginConfig struct {
	SeerrURL string `json:"seerrUrl"`
}

type seerConfigCacheEntry struct {
	seerURL   string
	expiresAt time.Time
}

var seerConfigCache = struct {
	mu      sync.Mutex
	entries map[string]seerConfigCacheEntry
}{entries: make(map[string]seerConfigCacheEntry)}

var seerSessionStore = struct {
	mu       sync.Mutex
	sessions map[string]string
}{sessions: loadSeerSessions()}

func normalizeJellyfinURL(raw string) string {
	return strings.TrimRight(strings.TrimSpace(raw), "/")
}

func getSeerSession(jellyfinURL string) string {
	seerSessionStore.mu.Lock()
	defer seerSessionStore.mu.Unlock()
	return seerSessionStore.sessions[normalizeJellyfinURL(jellyfinURL)]
}

func setSeerSession(jellyfinURL, session string) {
	key := normalizeJellyfinURL(jellyfinURL)

	seerSessionStore.mu.Lock()
	if session == "" {
		delete(seerSessionStore.sessions, key)
	} else {
		seerSessionStore.sessions[key] = session
	}
	snapshot := make(map[string]string, len(seerSessionStore.sessions))
	for k, v := range seerSessionStore.sessions {
		snapshot[k] = v
	}
	seerSessionStore.mu.Unlock()

	persistSeerSessions(snapshot)
}

func seerSessionsPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir = filepath.Join(dir, "Pelagica")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "seer-sessions.json"), nil
}

func loadSeerSessions() map[string]string {
	path, err := seerSessionsPath()
	if err != nil {
		return map[string]string{}
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return map[string]string{}
	}

	var sessions map[string]string
	if err := json.Unmarshal(data, &sessions); err != nil || sessions == nil {
		return map[string]string{}
	}
	return sessions
}

func persistSeerSessions(sessions map[string]string) {
	path, err := seerSessionsPath()
	if err != nil {
		log.Printf("seer session: failed to resolve storage path: %v", err)
		return
	}

	data, err := json.Marshal(sessions)
	if err != nil {
		log.Printf("seer session: failed to encode sessions: %v", err)
		return
	}

	if err := os.WriteFile(path, data, 0o600); err != nil {
		log.Printf("seer session: failed to persist sessions: %v", err)
	}
}

func getSeerURL(jellyfinURL string) (string, error) {
	jellyfinURL = normalizeJellyfinURL(jellyfinURL)
	if jellyfinURL == "" {
		return "", errors.New("missing jellyfin_url")
	}

	seerConfigCache.mu.Lock()
	if entry, ok := seerConfigCache.entries[jellyfinURL]; ok && time.Now().Before(entry.expiresAt) {
		seerConfigCache.mu.Unlock()
		if entry.seerURL == "" {
			return "", errors.New("seer URL not configured")
		}
		return entry.seerURL, nil
	}
	seerConfigCache.mu.Unlock()

	req, err := http.NewRequest(http.MethodGet, jellyfinURL+"/Pelagica/Config", nil)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: seerRequestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("plugin config request failed: status %d", resp.StatusCode)
	}

	var cfg pelagicaPluginConfig
	if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
		return "", err
	}
	seerURL := strings.TrimRight(cfg.SeerrURL, "/")

	seerConfigCache.mu.Lock()
	seerConfigCache.entries[jellyfinURL] = seerConfigCacheEntry{
		seerURL:   seerURL,
		expiresAt: time.Now().Add(seerConfigCacheTTL),
	}
	seerConfigCache.mu.Unlock()

	if seerURL == "" {
		return "", errors.New("seer URL not configured")
	}
	return seerURL, nil
}

func seerJellyfinURL(r *http.Request) string {
	return r.URL.Query().Get("jellyfin_url")
}

func writeSeerJSON(w http.ResponseWriter, status int, body []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

func handleSeerLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Username == "" || body.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "Username and password are required")
		return
	}

	seerURL, err := getSeerURL(seerJellyfinURL(r))
	if err != nil {
		writeJSONError(w, http.StatusBadGateway, "Seer not configured")
		return
	}

	payload, err := json.Marshal(map[string]string{
		"username": body.Username,
		"password": body.Password,
	})
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Failed to build Seer request")
		return
	}

	client := &http.Client{Timeout: seerRequestTimeout}
	resp, err := client.Post(seerURL+"/api/v1/auth/jellyfin", "application/json", bytes.NewReader(payload))
	if err != nil {
		log.Printf("seer login: failed to reach seer: %v", err)
		writeJSONError(w, http.StatusBadGateway, "Failed to reach Seer")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		writeJSONError(w, http.StatusBadGateway, "Failed to read Seer response")
		return
	}

	if resp.StatusCode != http.StatusOK {
		writeSeerJSON(w, resp.StatusCode, respBody)
		return
	}

	for _, cookie := range resp.Cookies() {
		if cookie.Name != "connect.sid" {
			continue
		}
		setSeerSession(seerJellyfinURL(r), cookie.Value)
		break
	}

	writeSeerJSON(w, http.StatusOK, respBody)
}

func handleSeerLogout(w http.ResponseWriter, r *http.Request) {
	session := getSeerSession(seerJellyfinURL(r))
	setSeerSession(seerJellyfinURL(r), "")

	if session == "" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	seerURL, err := getSeerURL(seerJellyfinURL(r))
	if err != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	req, err := http.NewRequest(http.MethodPost, seerURL+"/api/v1/auth/logout", nil)
	if err != nil {
		log.Printf("seer logout: failed to build request: %v", err)
		w.WriteHeader(http.StatusNoContent)
		return
	}
	req.AddCookie(&http.Cookie{Name: "connect.sid", Value: session})

	client := &http.Client{Timeout: seerRequestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("seer logout: request failed: %v", err)
		w.WriteHeader(http.StatusNoContent)
		return
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	w.WriteHeader(http.StatusNoContent)
}

// proxySeerGet forwards a GET request to Seer, attaching the caller's Seer
// session cookie if present, and relays the status and body back verbatim.
func proxySeerGet(w http.ResponseWriter, r *http.Request, seerPath string) {
	seerURL, err := getSeerURL(seerJellyfinURL(r))
	if err != nil {
		writeJSONError(w, http.StatusBadGateway, "Seer not configured")
		return
	}

	req, err := http.NewRequest(http.MethodGet, seerURL+seerPath, nil)
	if err != nil {
		log.Printf("seer proxy: failed to build request: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to build Seer request")
		return
	}
	if session := getSeerSession(seerJellyfinURL(r)); session != "" {
		req.AddCookie(&http.Cookie{Name: "connect.sid", Value: session})
	}

	client := &http.Client{Timeout: seerRequestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("seer proxy: request failed: %v", err)
		writeJSONError(w, http.StatusBadGateway, "Failed to reach Seer")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		writeJSONError(w, http.StatusBadGateway, "Failed to read Seer response")
		return
	}

	writeSeerJSON(w, resp.StatusCode, respBody)
}

func handleSeerMovieRecommendations(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/movie/"+r.PathValue("tmdbId")+"/recommendations")
}

func handleSeerTvRecommendations(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/tv/"+r.PathValue("tvId")+"/recommendations")
}

func handleSeerMovieDetails(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/movie/"+r.PathValue("tmdbId"))
}

func handleSeerTvDetails(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/tv/"+r.PathValue("tvId"))
}

func handleSeerPersonCombinedCredits(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/person/"+r.PathValue("personId")+"/combined_credits")
}

func handleSeerDiscoverTrending(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/discover/trending")
}

func handleSeerDiscoverMovies(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/discover/movies")
}

func handleSeerDiscoverTv(w http.ResponseWriter, r *http.Request) {
	proxySeerGet(w, r, "/api/v1/discover/tv")
}

func allowedSeerCatalogPath(path string) bool {
	path = strings.Trim(strings.TrimSpace(path), "/")
	if path == "" || strings.Contains(path, "..") || strings.ContainsAny(path, `\#?%`) {
		return false
	}
	for _, r := range path {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '/' || r == '-' || r == '_' {
			continue
		}
		return false
	}
	switch path {
	case "settings/discover", "search", "discover":
		return true
	}
	return strings.HasPrefix(path, "discover/")
}

func handleSeerCatalog(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if !allowedSeerCatalogPath(path) {
		writeJSONError(w, http.StatusBadRequest, "Invalid catalog path")
		return
	}

	query := url.Values{}
	for key, values := range r.URL.Query() {
		if key == "path" || key == "jellyfin_url" {
			continue
		}
		for _, value := range values {
			query.Add(key, value)
		}
	}

	seerPath := "/api/v1/" + strings.Trim(path, "/")
	if encoded := query.Encode(); encoded != "" {
		seerPath += "?" + strings.ReplaceAll(encoded, "+", "%20")
	}
	proxySeerGet(w, r, seerPath)
}

func handleSeerSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		writeJSONError(w, http.StatusBadRequest, "Query is required")
		return
	}
	encodedQuery := strings.ReplaceAll(url.QueryEscape(query), "+", "%20")
	proxySeerGet(w, r, "/api/v1/search?query="+encodedQuery)
}

func handleSeerRequest(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "Failed to read request body")
		return
	}

	seerURL, err := getSeerURL(seerJellyfinURL(r))
	if err != nil {
		writeJSONError(w, http.StatusBadGateway, "Seer not configured")
		return
	}

	req, err := http.NewRequest(http.MethodPost, seerURL+"/api/v1/request", bytes.NewReader(body))
	if err != nil {
		log.Printf("seer request: failed to build request: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to build Seer request")
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if session := getSeerSession(seerJellyfinURL(r)); session != "" {
		req.AddCookie(&http.Cookie{Name: "connect.sid", Value: session})
	}

	client := &http.Client{Timeout: seerRequestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("seer request: request failed: %v", err)
		writeJSONError(w, http.StatusBadGateway, "Failed to reach Seer")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		writeJSONError(w, http.StatusBadGateway, "Failed to read Seer response")
		return
	}

	writeSeerJSON(w, resp.StatusCode, respBody)
}

type seerrStatusResponse struct {
	LoggedIn bool `json:"loggedIn"`
}

func writeSeerStatus(w http.ResponseWriter, loggedIn bool) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(seerrStatusResponse{LoggedIn: loggedIn})
}

func handleSeerStatus(w http.ResponseWriter, r *http.Request) {
	session := getSeerSession(seerJellyfinURL(r))
	if session == "" {
		writeSeerStatus(w, false)
		return
	}

	seerURL, err := getSeerURL(seerJellyfinURL(r))
	if err != nil {
		writeSeerStatus(w, false)
		return
	}

	req, err := http.NewRequest(http.MethodGet, seerURL+"/api/v1/auth/me", nil)
	if err != nil {
		log.Printf("seer status: failed to build request: %v", err)
		writeSeerStatus(w, false)
		return
	}
	req.AddCookie(&http.Cookie{Name: "connect.sid", Value: session})

	client := &http.Client{Timeout: seerRequestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("seer status: request failed: %v", err)
		writeSeerStatus(w, false)
		return
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	if resp.StatusCode != http.StatusOK {
		setSeerSession(seerJellyfinURL(r), "")
		writeSeerStatus(w, false)
		return
	}

	writeSeerStatus(w, true)
}

func registerSeerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/seerr/login", handleSeerLogin)
	mux.HandleFunc("POST /api/seerr/logout", handleSeerLogout)
	mux.HandleFunc("GET /api/seerr/movie/{tmdbId}/recommendations", handleSeerMovieRecommendations)
	mux.HandleFunc("GET /api/seerr/tv/{tvId}/recommendations", handleSeerTvRecommendations)
	mux.HandleFunc("GET /api/seerr/movie/{tmdbId}", handleSeerMovieDetails)
	mux.HandleFunc("GET /api/seerr/tv/{tvId}", handleSeerTvDetails)
	mux.HandleFunc("GET /api/seerr/person/{personId}/combined_credits", handleSeerPersonCombinedCredits)
	mux.HandleFunc("POST /api/seerr/request", handleSeerRequest)
	mux.HandleFunc("GET /api/seerr/search", handleSeerSearch)
	mux.HandleFunc("GET /api/seerr/status", handleSeerStatus)
	mux.HandleFunc("GET /api/seerr/discover/trending", handleSeerDiscoverTrending)
	mux.HandleFunc("GET /api/seerr/discover/movies", handleSeerDiscoverMovies)
	mux.HandleFunc("GET /api/seerr/discover/tv", handleSeerDiscoverTv)
	mux.HandleFunc("GET /api/seerr/catalog", handleSeerCatalog)
}
