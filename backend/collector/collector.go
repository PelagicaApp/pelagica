package collector

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
)

type ConsentStatus int

const (
	ConsentGiven ConsentStatus = iota
	ConsentUnspecified
	ConsentDenied
)

func getPingToken() string {
	return os.Getenv("COLLECTOR_PING_TOKEN")
}

func getPingBaseUrl() string {
	baseUrl := os.Getenv("COLLECTOR_PING_BASE_URL")
	if baseUrl == "" {
		baseUrl = "https://stats.pelagica.app"
	}
	return baseUrl
}

func getVersion() string {
	appVersion := os.Getenv("APP_VERSION")
	if appVersion == "" {
		slog.Warn("APP_VERSION not set, ping will be sent without version information")
		appVersion = "0.0.0"
	}
	return appVersion
}

func getInstanceIdFile() string {
	return os.Getenv("COLLECTOR_INSTANCE_ID_FILE")
}

func getStatsConsentFile() string {
	return os.Getenv("COLLECTOR_STATS_CONSENT_FILE")
}

// hasStatsConsent determines whether the user has consented to anonymous statistics collection
// Return values:
// 0 -> consent explicitly given
// 1 -> consent not specified or invalid
// 2 -> consent explicitly denied
func HasStatsConsent() ConsentStatus {
	parseBool := func(v string) (bool, bool) {
		switch strings.ToLower(strings.TrimSpace(v)) {
		case "true":
			return true, true
		case "false":
			return false, true
		default:
			return false, false
		}
	}

	if envValue := os.Getenv("COLLECTOR_STATS_CONSENT"); envValue != "" {
		if val, ok := parseBool(envValue); ok {
			if val {
				return ConsentGiven
			}
			return ConsentDenied
		}
	}

	if file := getStatsConsentFile(); file != "" {
		content, err := os.ReadFile(file)
		if err == nil {
			if val, ok := parseBool(string(content)); ok {
				if val {
					return ConsentGiven
				}
				return ConsentDenied
			}
		}
	}

	return ConsentUnspecified
}

func WriteStatsConsent(consent bool) error {
	file := getStatsConsentFile()
	if file == "" {
		return fmt.Errorf("COLLECTOR_STATS_CONSENT_FILE is not set")
	}

	if err := os.MkdirAll(filepath.Dir(file), 0755); err != nil {
		return fmt.Errorf("failed to create directories for stats consent file: %w", err)
	}

	value := "false"
	if consent {
		value = "true"
	}
	return os.WriteFile(file, []byte(value+"\n"), 0644)

}

func getInstanceId() (string, error) {
	path := getInstanceIdFile()
	if path == "" {
		slog.Warn("COLLECTOR_INSTANCE_ID_FILE not set, instance ID will not be persisted across restarts")
		return uuid.New().String(), nil
	}

	if data, err := os.ReadFile(path); err == nil {
		id := strings.TrimSpace(string(data))
		if isValidUUIDv4(id) {
			return id, nil
		}
	}

	id := uuid.New().String()

	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return "", fmt.Errorf("failed to create directories for instance ID file: %w", err)
	}
	if err := os.WriteFile(path, []byte(id), 0644); err != nil {
		return "", fmt.Errorf("failed to write instance ID file: %w", err)
	}

	return id, nil
}

func isValidUUIDv4(s string) bool {
	id, err := uuid.Parse(s)
	return err == nil && id.Version() == 4
}

func sendPing(baseURL, instanceID, version, token string) error {
	body := map[string]string{
		"instance_id": instanceID,
		"version":     version,
	}
	if token != "" {
		body["token"] = token
	}
	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal ping payload: %w", err)
	}

	endpoint, err := url.JoinPath(baseURL, "/ping")
	if err != nil {
		return fmt.Errorf("invalid base URL: %w", err)
	}
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(endpoint, "application/json", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("failed to send ping: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusNoContent:
		return nil
	case http.StatusBadRequest:
		return fmt.Errorf("invalid ping payload")
	case http.StatusUnauthorized:
		return fmt.Errorf("ping rejected: unauthorized")
	case http.StatusTooManyRequests:
		return fmt.Errorf("ping rejected: rate limit exceeded")
	default:
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

func RegisterStatsJob() *cron.Cron {
	c := cron.New()
	_, err := c.AddFunc("0 0 * * *", func() {
		if HasStatsConsent() != ConsentGiven {
			slog.Debug("Stats collection skipped: user has not given consent")
			return
		}

		instanceId, err := getInstanceId()
		if err != nil {
			slog.Error("Failed to get instance ID", "error", err)
			return
		}

		err = sendPing(getPingBaseUrl(), instanceId, getVersion(), getPingToken())
		if err != nil {
			slog.Error("Failed to send stats ping", "error", err)
		}
		slog.Info("Stats ping sent successfully", "instance_id", instanceId)
	})
	if err != nil {
		slog.Error("Failed to register stats job", "error", err)
		return nil
	}
	c.Start()
	slog.Info("Stats collection job registered to run daily at midnight")
	return c
}
