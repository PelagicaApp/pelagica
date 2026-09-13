package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	statsPingURL            = "https://stats.pelagica.app/ping"
	statsPingInterval       = 24 * time.Hour
	statsCheckInterval      = time.Hour
	statsInstanceIDFile     = "stats-instance-id"
	statsConsentFile        = "stats-consent"
	statsLastPingFile       = "stats-last-ping"
	statsPingRequestTimeout = 10 * time.Second
)

// appVersion and pingToken are baked in at build time via
// -ldflags "-X main.appVersion=... -X main.pingToken=...", the latter from the same
// secret the backend and TV clients get their ping token from.
var (
	appVersion = "0.0.0"
	pingToken  = ""
)

func statsClientPlatform() string {
	switch runtime.GOOS {
	case "darwin":
		return "macos"
	case "windows":
		return "windows"
	case "linux":
		return "linux"
	default:
		return "unknown"
	}
}

// readStatsConsent returns (consent, explicitlySet). explicitlySet is false until the
// user has answered the consent prompt at least once.
func readStatsConsent() (consent, explicitlySet bool) {
	path, err := configFilePath(statsConsentFile)
	if err != nil {
		return false, false
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return false, false
	}
	switch strings.TrimSpace(string(data)) {
	case "true":
		return true, true
	case "false":
		return false, true
	default:
		return false, false
	}
}

func writeStatsConsent(consent bool) error {
	path, err := configFilePath(statsConsentFile)
	if err != nil {
		return err
	}
	value := "false"
	if consent {
		value = "true"
	}
	return os.WriteFile(path, []byte(value), 0o644)
}

func getOrCreateStatsInstanceID() string {
	path, err := configFilePath(statsInstanceIDFile)
	if err == nil {
		if data, readErr := os.ReadFile(path); readErr == nil {
			if id := strings.TrimSpace(string(data)); isValidUUIDv4(id) {
				return id
			}
		}
	}

	id := uuid.New().String()
	if path != "" {
		_ = os.WriteFile(path, []byte(id), 0o644)
	}
	return id
}

func isValidUUIDv4(s string) bool {
	id, err := uuid.Parse(s)
	return err == nil && id.Version() == 4
}

func lastStatsPingTime() time.Time {
	path, err := configFilePath(statsLastPingFile)
	if err != nil {
		return time.Time{}
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return time.Time{}
	}
	unixSeconds, err := strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64)
	if err != nil {
		return time.Time{}
	}
	return time.Unix(unixSeconds, 0)
}

func writeLastStatsPingTime(t time.Time) {
	path, err := configFilePath(statsLastPingFile)
	if err != nil {
		return
	}
	_ = os.WriteFile(path, []byte(strconv.FormatInt(t.Unix(), 10)), 0o644)
}

func sendStatsPing() error {
	body := map[string]string{
		"instance_id":     getOrCreateStatsInstanceID(),
		"version":         appVersion,
		"client_type":     "desktop",
		"client_platform": statsClientPlatform(),
	}
	if pingToken != "" {
		body["token"] = pingToken
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal ping payload: %w", err)
	}

	client := &http.Client{Timeout: statsPingRequestTimeout}
	resp, err := client.Post(statsPingURL, "application/json", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("failed to send ping: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	return nil
}

// checkAndSendStatsPing sends a ping if the user has consented and it's been more
// than 24h since the last one.
func checkAndSendStatsPing() {
	consent, explicitlySet := readStatsConsent()
	if !explicitlySet || !consent {
		return
	}

	if time.Since(lastStatsPingTime()) < statsPingInterval {
		return
	}

	if err := sendStatsPing(); err != nil {
		log.Printf("stats: failed to send ping: %v", err)
		return
	}
	writeLastStatsPingTime(time.Now())
}

// startStatsCollector checks once now, then hourly, whether a ping is due. The hourly
// cadence (rather than a daily cron like the server backend) is because the app isn't
// guaranteed to be running at any fixed time of day.
func startStatsCollector() {
	checkAndSendStatsPing()

	ticker := time.NewTicker(statsCheckInterval)
	go func() {
		for range ticker.C {
			checkAndSendStatsPing()
		}
	}()
}

func handleGetStatsConsent(w http.ResponseWriter, _ *http.Request) {
	consent, explicitlySet := readStatsConsent()
	value := 1
	if explicitlySet {
		if consent {
			value = 0
		} else {
			value = 2
		}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]int{"consent": value})
}

func handlePostStatsConsent(w http.ResponseWriter, r *http.Request) {
	consent := r.URL.Query().Get("consent") == "true"
	if err := writeStatsConsent(consent); err != nil {
		log.Printf("stats: failed to save consent: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to save stats consent")
		return
	}

	// Don't wait for the next hourly check to send the first ping after opting in.
	go checkAndSendStatsPing()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"consent": consent})
}

func registerStatsRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/stats-consent", handleGetStatsConsent)
	mux.HandleFunc("POST /api/stats-consent", handlePostStatsConsent)
}
