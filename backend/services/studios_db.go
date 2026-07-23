package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/robfig/cron/v3"
	_ "modernc.org/sqlite"
)

const (
	studiosDBOwner           = "PelagicaApp"
	studiosDBRepo            = "studios-parser"
	studiosDBAssetName       = "companies_logosonly.db"
	studiosDBFileName        = "companies_logosonly.db"
	studiosDBTagFileName     = "release.tag"
	defaultStudiosDBDir      = "./cache/studios-db"
	studiosDBTempSubdir      = ".tmp"
	githubAPIRequestTimeout  = 30 * time.Second
	studiosDBDownloadTimeout = 2 * time.Minute
)

type githubReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type githubRelease struct {
	TagName string               `json:"tag_name"`
	Assets  []githubReleaseAsset `json:"assets"`
}

// StudioLogo describes a resolved studio logo from the studios database.
type StudioLogo struct {
	LogoPath string
}

var studiosDB = struct {
	mu    sync.RWMutex
	conn  *sql.DB
	tag   string
	names map[string]struct{}
}{}

// NormalizeStudioName lowercases and collapses whitespace so studio names
// from Jellyfin, TMDB, and user input compare equal regardless of spacing.
func NormalizeStudioName(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return ""
	}
	return strings.ToLower(strings.Join(parts, " "))
}

func studiosDBDir() string {
	dir := strings.TrimSpace(os.Getenv("STUDIOS_DB_DIR"))
	if dir == "" {
		dir = defaultStudiosDBDir
	}
	return dir
}

func studiosDBPath() string {
	return filepath.Join(studiosDBDir(), studiosDBFileName)
}

func studiosDBTagPath() string {
	return filepath.Join(studiosDBDir(), studiosDBTagFileName)
}

// readCachedStudiosDBTag returns the release tag recorded alongside a
// previously downloaded studios DB, or "" if none is recorded.
func readCachedStudiosDBTag() string {
	data, err := os.ReadFile(studiosDBTagPath())
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func studiosDBReleasesURL() string {
	url := strings.TrimSpace(os.Getenv("STUDIOS_DB_RELEASES_URL"))
	if url == "" {
		url = fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", studiosDBOwner, studiosDBRepo)
	}
	return url
}

// InitStudiosDB opens any previously cached studios database from disk so the
// service can start serving immediately, then refreshes it from the latest
// upstream release.
func InitStudiosDB() {
	if err := os.MkdirAll(filepath.Join(studiosDBDir(), studiosDBTempSubdir), 0o755); err != nil {
		slog.Error("Failed to create studios DB cache dir", "error", err)
	}

	if _, err := os.Stat(studiosDBPath()); err == nil {
		tag := readCachedStudiosDBTag()
		if err := loadStudiosDB(studiosDBPath(), tag); err != nil {
			slog.Warn("Failed to open cached studios DB", "error", err)
		} else {
			slog.Info("Loaded cached studios DB from disk", "release", tag)
		}
	}

	if err := RefreshStudiosDB(); err != nil {
		slog.Error("Failed to refresh studios DB", "error", err)
	}
}

// RegisterStudiosDBRefreshJob schedules a weekly check for a newer studios
// database release, mirroring the stats collector's cron job.
func RegisterStudiosDBRefreshJob() *cron.Cron {
	c := cron.New()
	_, err := c.AddFunc("0 0 * * 0", func() { // every Sunday at midnight
		if err := RefreshStudiosDB(); err != nil {
			slog.Error("Failed to refresh studios DB", "error", err)
		}
	})
	if err != nil {
		slog.Error("Failed to register studios DB refresh job", "error", err)
		return nil
	}
	c.Start()
	slog.Info("Studios DB refresh job registered to run weekly on Sundays at midnight")
	return c
}

// RefreshStudiosDB checks the latest studios-parser release and downloads it
// only if it differs from the currently loaded release.
func RefreshStudiosDB() error {
	release, err := fetchLatestStudiosRelease()
	if err != nil {
		return fmt.Errorf("failed to fetch latest studios-parser release: %w", err)
	}

	studiosDB.mu.RLock()
	upToDate := studiosDB.conn != nil && studiosDB.tag == release.TagName
	studiosDB.mu.RUnlock()

	if upToDate {
		slog.Debug("Studios DB already up to date", "release", release.TagName)
		return nil
	}

	var assetURL string
	for _, asset := range release.Assets {
		if asset.Name == studiosDBAssetName {
			assetURL = asset.BrowserDownloadURL
			break
		}
	}
	if assetURL == "" {
		return fmt.Errorf("release %s has no %s asset", release.TagName, studiosDBAssetName)
	}

	tmpDir := filepath.Join(studiosDBDir(), studiosDBTempSubdir)
	tmpPath, err := downloadStudiosDBAsset(assetURL, tmpDir)
	if err != nil {
		return fmt.Errorf("failed to download studios DB: %w", err)
	}

	if err := verifyStudiosDBFile(tmpPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("downloaded studios DB failed verification: %w", err)
	}

	dbPath := studiosDBPath()
	if err := os.Rename(tmpPath, dbPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to publish studios DB: %w", err)
	}

	if err := loadStudiosDB(dbPath, release.TagName); err != nil {
		return fmt.Errorf("failed to load downloaded studios DB: %w", err)
	}

	if err := os.WriteFile(studiosDBTagPath(), []byte(release.TagName), 0o644); err != nil {
		slog.Warn("Failed to persist studios DB release tag", "error", err)
	}

	slog.Info("Studios DB refreshed", "release", release.TagName)
	return nil
}

func fetchLatestStudiosRelease() (*githubRelease, error) {
	req, err := http.NewRequest(http.MethodGet, studiosDBReleasesURL(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")

	client := &http.Client{Timeout: githubAPIRequestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return nil, fmt.Errorf("status=%d body=%s", resp.StatusCode, body)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}
	if release.TagName == "" {
		return nil, errors.New("release response missing tag_name")
	}

	return &release, nil
}

// downloadStudiosDBAsset streams the asset into a temp file inside tmpDir so
// the caller can atomically rename it into place on the same filesystem.
func downloadStudiosDBAsset(assetURL, tmpDir string) (string, error) {
	req, err := http.NewRequest(http.MethodGet, assetURL, nil)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: studiosDBDownloadTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("upstream returned status %d", resp.StatusCode)
	}

	tmpFile, err := os.CreateTemp(tmpDir, "companies-*.db.tmp")
	if err != nil {
		return "", err
	}
	tmpPath := tmpFile.Name()

	if _, err := io.Copy(tmpFile, resp.Body); err != nil {
		tmpFile.Close()
		os.Remove(tmpPath)
		return "", err
	}
	if err := tmpFile.Close(); err != nil {
		os.Remove(tmpPath)
		return "", err
	}

	return tmpPath, nil
}

// verifyStudiosDBFile confirms a downloaded file is actually a readable
// SQLite database with the expected schema before it is published.
func verifyStudiosDBFile(path string) error {
	conn, err := sql.Open("sqlite", "file:"+path+"?mode=ro")
	if err != nil {
		return err
	}
	defer conn.Close()

	if err := conn.Ping(); err != nil {
		return err
	}

	var count int
	if err := conn.QueryRow("SELECT COUNT(*) FROM companies").Scan(&count); err != nil {
		return fmt.Errorf("unexpected schema: %w", err)
	}

	return nil
}

// loadStudiosDB opens dbPath, builds the in-memory set of studio names that
// have a logo, and swaps it in as the active database, closing the previous
// connection.
func loadStudiosDB(dbPath, tag string) error {
	conn, err := sql.Open("sqlite", "file:"+dbPath+"?mode=ro")
	if err != nil {
		return err
	}
	if err := conn.Ping(); err != nil {
		conn.Close()
		return err
	}

	names, err := loadStudioNamesWithLogo(conn)
	if err != nil {
		conn.Close()
		return err
	}

	studiosDB.mu.Lock()
	defer studiosDB.mu.Unlock()

	if studiosDB.conn != nil {
		studiosDB.conn.Close()
	}
	studiosDB.conn = conn
	studiosDB.tag = tag
	studiosDB.names = names

	return nil
}

func loadStudioNamesWithLogo(conn *sql.DB) (map[string]struct{}, error) {
	rows, err := conn.Query(`SELECT name FROM companies WHERE logo_file_path IS NOT NULL AND logo_file_path != ''`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	names := make(map[string]struct{})
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		normalized := NormalizeStudioName(name)
		if normalized == "" {
			continue
		}
		names[normalized] = struct{}{}
	}

	return names, rows.Err()
}

// HasStudioLogo reports whether the studios database has a logo for name.
func HasStudioLogo(name string) bool {
	normalized := NormalizeStudioName(name)
	if normalized == "" {
		return false
	}

	studiosDB.mu.RLock()
	defer studiosDB.mu.RUnlock()

	if studiosDB.names == nil {
		return false
	}
	_, ok := studiosDB.names[normalized]
	return ok
}

// GetStudioLogo looks up the best-voted logo for a studio name. It returns
// (nil, nil) when the studio has no logo on record.
func GetStudioLogo(name string) (*StudioLogo, error) {
	normalized := NormalizeStudioName(name)
	if normalized == "" {
		return nil, nil
	}

	studiosDB.mu.RLock()
	conn := studiosDB.conn
	studiosDB.mu.RUnlock()

	if conn == nil {
		return nil, errors.New("studios database is not loaded")
	}

	var logoPath sql.NullString
	err := conn.QueryRow(
		`SELECT logo_file_path FROM companies
		 WHERE LOWER(name) = ? AND logo_file_path IS NOT NULL AND logo_file_path != ''
		 ORDER BY logo_vote_average DESC, logo_vote_count DESC
		 LIMIT 1`,
		normalized,
	).Scan(&logoPath)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if !logoPath.Valid || logoPath.String == "" {
		return nil, nil
	}

	return &StudioLogo{LogoPath: logoPath.String}, nil
}
