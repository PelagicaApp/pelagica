package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

const (
	studiosDBOwner           = "PelagicaApp"
	studiosDBRepo            = "studios-parser"
	studiosDBAssetName       = "companies_logosonly.db"
	studiosDBFileName        = "companies_logosonly.db"
	studiosDBTagFileName     = "release.tag"
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

// studioLogo describes a resolved studio logo from the studios database.
type studioLogo struct {
	LogoPath string
}

var studiosDB = struct {
	mu   sync.RWMutex
	conn *sql.DB
	tag  string
}{}

// normalizeStudioName lowercases and collapses whitespace so studio names
// from Jellyfin and TMDB compare equal regardless of spacing.
func normalizeStudioName(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return ""
	}
	return strings.ToLower(strings.Join(parts, " "))
}

// studiosDBDir returns (and creates) the per-user directory used to cache the
// downloaded studios database, mirroring appIconPreferencePath's convention.
func studiosDBDir() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir = filepath.Join(dir, "Pelagica", "studios-db")
	if err := os.MkdirAll(filepath.Join(dir, studiosDBTempSubdir), 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

func studiosDBPath(dir string) string {
	return filepath.Join(dir, studiosDBFileName)
}

func studiosDBTagPath(dir string) string {
	return filepath.Join(dir, studiosDBTagFileName)
}

// readCachedStudiosDBTag returns the release tag recorded alongside a
// previously downloaded studios DB, or "" if none is recorded.
func readCachedStudiosDBTag(dir string) string {
	data, err := os.ReadFile(studiosDBTagPath(dir))
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func studiosDBReleasesURL() string {
	return fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", studiosDBOwner, studiosDBRepo)
}

// initStudiosDB opens any previously cached studios database from disk so
// logo lookups can start serving immediately, then refreshes it from the
// latest upstream release in the background.
func initStudiosDB() {
	dir, err := studiosDBDir()
	if err != nil {
		log.Printf("studios db: failed to resolve cache dir: %v", err)
		return
	}

	if _, err := os.Stat(studiosDBPath(dir)); err == nil {
		tag := readCachedStudiosDBTag(dir)
		if err := loadStudiosDB(studiosDBPath(dir), tag); err != nil {
			log.Printf("studios db: failed to open cached db: %v", err)
		} else {
			log.Printf("studios db: loaded cached db (release %s)", tag)
		}
	}

	go func() {
		if err := refreshStudiosDB(); err != nil {
			log.Printf("studios db: failed to refresh: %v", err)
		}
	}()
}

// refreshStudiosDB checks the latest studios-parser release and downloads it
// only if it differs from the currently loaded release.
func refreshStudiosDB() error {
	dir, err := studiosDBDir()
	if err != nil {
		return err
	}

	release, err := fetchLatestStudiosRelease()
	if err != nil {
		return fmt.Errorf("failed to fetch latest studios-parser release: %w", err)
	}

	studiosDB.mu.RLock()
	upToDate := studiosDB.conn != nil && studiosDB.tag == release.TagName
	studiosDB.mu.RUnlock()

	if upToDate {
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

	tmpDir := filepath.Join(dir, studiosDBTempSubdir)
	tmpPath, err := downloadStudiosDBAsset(assetURL, tmpDir)
	if err != nil {
		return fmt.Errorf("failed to download studios db: %w", err)
	}

	if err := verifyStudiosDBFile(tmpPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("downloaded studios db failed verification: %w", err)
	}

	dbPath := studiosDBPath(dir)
	if err := os.Rename(tmpPath, dbPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to publish studios db: %w", err)
	}

	if err := loadStudiosDB(dbPath, release.TagName); err != nil {
		return fmt.Errorf("failed to load downloaded studios db: %w", err)
	}

	if err := os.WriteFile(studiosDBTagPath(dir), []byte(release.TagName), 0o644); err != nil {
		log.Printf("studios db: failed to persist release tag: %v", err)
	}

	log.Printf("studios db: refreshed (release %s)", release.TagName)
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

// loadStudiosDB opens dbPath and swaps it in as the active database, closing
// the previous connection.
func loadStudiosDB(dbPath, tag string) error {
	conn, err := sql.Open("sqlite", "file:"+dbPath+"?mode=ro")
	if err != nil {
		return err
	}
	if err := conn.Ping(); err != nil {
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

	return nil
}

// getStudioLogo looks up the best-voted logo for a studio name. It returns
// (nil, nil) when the studio has no logo on record.
func getStudioLogo(name string) (*studioLogo, error) {
	normalized := normalizeStudioName(name)
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

	return &studioLogo{LogoPath: logoPath.String}, nil
}
