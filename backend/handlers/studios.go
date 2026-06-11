package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"pelagica-backend/models"

	"github.com/gofiber/fiber/v3"
	"golang.org/x/sync/singleflight"
)

type studioThumbEntry struct {
	Name        string `json:"name"`
	MachineName string `json:"machine-name"`
}

const (
	defaultStudiosCacheTTL    = 10 * time.Minute
	defaultThumbsCacheTTL     = 12 * time.Hour
	defaultStudiosLimit       = 20
	maxStudiosLimit           = 300
	studiosJSONURL            = "https://raw.githubusercontent.com/Entree3k/Jellyfin/main/studios/studios.json"
	thumbBaseURL              = "https://raw.githubusercontent.com/Entree3k/Jellyfin/main/studios/"
	defaultJellyfinPageSize   = 300
	studioThumbCacheControl   = "public, max-age=86400"
	studioThumbContentType    = "image/webp"
	thumbsListRequestTimeout  = 10 * time.Second
	jellyfinItemsRequestLimit = 30 * time.Second
	defaultThumbCacheDir      = "./cache/studio-thumbs"
	thumbCacheTempSubdir      = ".tmp"
)

type studiosCacheEntry struct {
	studios   []models.StudioSummary
	expiresAt time.Time
}

type thumbsCacheEntry struct {
	thumbs    map[string]struct{}
	expiresAt time.Time
}

var studiosCache = struct {
	mu      sync.RWMutex
	entries map[string]studiosCacheEntry
}{
	entries: map[string]studiosCacheEntry{},
}

var thumbsCache = struct {
	mu    sync.RWMutex
	entry thumbsCacheEntry
}{}

// thumbFetchGroup deduplicates concurrent fetches for the same studio thumbnail.
var thumbFetchGroup singleflight.Group

type jellyfinItemsResponse struct {
	Items []struct {
		Studios []struct {
			ID   string `json:"Id"`
			Name string `json:"Name"`
		} `json:"Studios"`
	} `json:"Items"`
	TotalRecordCount int `json:"TotalRecordCount"`
}

type jellyfinMeResponse struct {
	ID string `json:"Id"`
}

func parseDurationFromEnv(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	d, err := time.ParseDuration(value)
	if err != nil || d <= 0 {
		return fallback
	}

	return d
}

func normalizeStudioName(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return ""
	}
	return strings.ToLower(strings.Join(parts, " "))
}

func parseJellyfinCredentials(c fiber.Ctx) (string, string, error) {
	jellyfinURLRaw := strings.TrimSpace(c.Query("jellyfin_url"))
	if jellyfinURLRaw == "" {
		return "", "", errors.New("missing jellyfin_url query parameter")
	}

	if _, err := url.ParseRequestURI(jellyfinURLRaw); err != nil {
		return "", "", errors.New("invalid jellyfin_url")
	}

	authorizationHeader := strings.TrimSpace(c.Get("Authorization"))
	if authorizationHeader == "" {
		return "", "", errors.New("missing Authorization header")
	}

	token := extractJellyfinToken(authorizationHeader)
	if token == "" {
		token = authorizationHeader
	}

	if strings.HasPrefix(strings.ToLower(token), "bearer ") {
		token = strings.TrimSpace(token[7:])
	}

	if token == "" {
		return "", "", errors.New("invalid Authorization header")
	}

	backendOverride := strings.TrimSpace(c.Query("jellyfin_backend_url"))
	if backendOverride == "" {
		backendOverride = strings.TrimSpace(os.Getenv("JELLYFIN_BACKEND_URL"))
	}

	if backendOverride != "" {
		if _, err := url.ParseRequestURI(backendOverride); err != nil {
			return "", "", errors.New("invalid jellyfin_backend_url")
		}
		jellyfinURLRaw = backendOverride
	}

	return jellyfinURLRaw, token, nil
}

func extractJellyfinToken(authorizationHeader string) string {
	lower := strings.ToLower(authorizationHeader)
	if !strings.HasPrefix(lower, "mediabrowser") {
		return ""
	}

	parts := strings.Split(authorizationHeader, ",")
	for _, part := range parts {
		piece := strings.TrimSpace(part)
		if !strings.Contains(strings.ToLower(piece), "token=") {
			continue
		}

		idx := strings.Index(piece, "=")
		if idx < 0 || idx+1 >= len(piece) {
			continue
		}

		value := strings.TrimSpace(piece[idx+1:])
		value = strings.Trim(value, `"`)
		if value != "" {
			return value
		}
	}

	return ""
}

func applyJellyfinAuthHeaders(req *http.Request, token string) {
	req.Header.Set("ApiKey", token)
	req.Header.Set("Authorization", `MediaBrowser Token="`+token+`"`)
}

func parseStudiosLimit(c fiber.Ctx) (int, error) {
	raw := strings.TrimSpace(c.Query("limit"))
	if raw == "" {
		return defaultStudiosLimit, nil
	}

	limit, err := strconv.Atoi(raw)
	if err != nil {
		return 0, errors.New("limit must be a valid number")
	}

	if limit <= 0 {
		return 0, errors.New("limit must be greater than 0")
	}

	if limit > maxStudiosLimit {
		limit = maxStudiosLimit
	}

	return limit, nil
}

func parseHasThumbOnly(c fiber.Ctx) (bool, error) {
	raw := strings.TrimSpace(c.Query("hasThumb"))
	if raw == "" {
		return false, nil
	}

	value, err := strconv.ParseBool(raw)
	if err != nil {
		return false, errors.New("hasThumb must be true or false")
	}

	return value, nil
}

func buildStudiosCacheKey(jellyfinURL, token string) string {
	return jellyfinURL + "\n" + token
}

func listStudiosFromJellyfin(jellyfinURL, token string) ([]models.StudioSummary, error) {
	baseURL, err := url.Parse(jellyfinURL)
	if err != nil {
		return nil, err
	}

	userID, err := fetchJellyfinUserID(baseURL, token)
	if err != nil {
		return nil, err
	}

	counts := make(map[string]*models.StudioSummary)
	startIndex := 0
	client := &http.Client{Timeout: jellyfinItemsRequestLimit}

	for {
		endpoint, _ := url.Parse("/Users/" + url.PathEscape(userID) + "/Items")
		fullURL := baseURL.ResolveReference(endpoint)

		q := fullURL.Query()
		q.Set("Recursive", "true")
		q.Set("IncludeItemTypes", "Movie,Series")
		q.Set("Fields", "Studios")
		q.Set("EnableImages", "false")
		q.Set("StartIndex", strconv.Itoa(startIndex))
		q.Set("Limit", strconv.Itoa(defaultJellyfinPageSize))
		fullURL.RawQuery = q.Encode()

		req, err := http.NewRequest(http.MethodGet, fullURL.String(), nil)
		if err != nil {
			return nil, err
		}

		applyJellyfinAuthHeaders(req, token)

		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
			resp.Body.Close()
			return nil, errors.New("failed to fetch Jellyfin items: status=" + strconv.Itoa(resp.StatusCode) + " body=" + string(body))
		}

		var payload jellyfinItemsResponse
		err = json.NewDecoder(resp.Body).Decode(&payload)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}

		if len(payload.Items) == 0 {
			break
		}

		for _, item := range payload.Items {
			for _, studio := range item.Studios {
				if studio.ID == "" || studio.Name == "" {
					continue
				}

				existing := counts[studio.ID]
				if existing != nil {
					existing.Count++
					continue
				}

				counts[studio.ID] = &models.StudioSummary{
					ID:    studio.ID,
					Name:  studio.Name,
					Count: 1,
				}
			}
		}

		startIndex += len(payload.Items)
		if len(payload.Items) < defaultJellyfinPageSize {
			break
		}
	}

	studios := make([]models.StudioSummary, 0, len(counts))
	for _, studio := range counts {
		studios = append(studios, *studio)
	}

	sort.Slice(studios, func(i, j int) bool {
		if studios[i].Count == studios[j].Count {
			return strings.ToLower(studios[i].Name) < strings.ToLower(studios[j].Name)
		}
		return studios[i].Count > studios[j].Count
	})

	log.Printf("studios: aggregated %d unique studios", len(studios))

	return studios, nil
}

func fetchJellyfinUserID(baseURL *url.URL, token string) (string, error) {
	endpoint, _ := url.Parse("/Users/Me")
	fullURL := baseURL.ResolveReference(endpoint)

	req, err := http.NewRequest(http.MethodGet, fullURL.String(), nil)
	if err != nil {
		return "", err
	}
	applyJellyfinAuthHeaders(req, token)

	resp, err := (&http.Client{Timeout: jellyfinItemsRequestLimit}).Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", errors.New("failed to resolve Jellyfin user: status=" + strconv.Itoa(resp.StatusCode) + " body=" + string(body))
	}

	var me jellyfinMeResponse
	if err := json.NewDecoder(resp.Body).Decode(&me); err != nil {
		return "", err
	}

	if strings.TrimSpace(me.ID) == "" {
		return "", errors.New("failed to resolve Jellyfin user: empty user id")
	}

	return me.ID, nil
}

func getStudiosWithCache(jellyfinURL, token string) ([]models.StudioSummary, error) {
	cacheKey := buildStudiosCacheKey(jellyfinURL, token)
	now := time.Now()

	studiosCache.mu.RLock()
	entry, ok := studiosCache.entries[cacheKey]
	studiosCache.mu.RUnlock()

	if ok && now.Before(entry.expiresAt) {
		return entry.studios, nil
	}

	studios, err := listStudiosFromJellyfin(jellyfinURL, token)
	if err != nil {
		return nil, err
	}

	ttl := parseDurationFromEnv("STUDIOS_CACHE_TTL", defaultStudiosCacheTTL)

	studiosCache.mu.Lock()
	studiosCache.entries[cacheKey] = studiosCacheEntry{
		studios:   studios,
		expiresAt: now.Add(ttl),
	}
	studiosCache.mu.Unlock()

	return studios, nil
}

func fetchThumbsList() (map[string]struct{}, error) {
	req, err := http.NewRequest(http.MethodGet, studiosJSONURL, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: thumbsListRequestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("failed to fetch studios json: status=" + strconv.Itoa(resp.StatusCode))
	}

	var entries []studioThumbEntry
	if err := json.NewDecoder(resp.Body).Decode(&entries); err != nil {
		return nil, err
	}

	thumbs := make(map[string]struct{}, len(entries))
	for _, e := range entries {
		name := strings.TrimSpace(e.Name)
		if name == "" {
			continue
		}
		thumbs[normalizeStudioName(name)] = struct{}{}
	}

	return thumbs, nil
}

func getThumbsListWithCache() (map[string]struct{}, error) {
	now := time.Now()

	thumbsCache.mu.RLock()
	entry := thumbsCache.entry
	thumbsCache.mu.RUnlock()

	if entry.thumbs != nil && now.Before(entry.expiresAt) {
		return entry.thumbs, nil
	}

	thumbs, err := fetchThumbsList()
	if err != nil {
		return nil, err
	}

	ttl := parseDurationFromEnv("STUDIO_THUMBS_CACHE_TTL", defaultThumbsCacheTTL)

	thumbsCache.mu.Lock()
	thumbsCache.entry = thumbsCacheEntry{
		thumbs:    thumbs,
		expiresAt: now.Add(ttl),
	}
	thumbsCache.mu.Unlock()

	log.Printf("studios: thumbs list refreshed (%d entries)", len(thumbs))

	return thumbs, nil
}

// thumbCacheDir returns the configured cache directory, ensuring it and its
// temp subdirectory exist.
func thumbCacheDir() (string, error) {
	dir := strings.TrimSpace(os.Getenv("STUDIO_THUMBS"))
	if dir == "" {
		dir = defaultThumbCacheDir
	}

	tmpDir := filepath.Join(dir, thumbCacheTempSubdir)
	if err := os.MkdirAll(tmpDir, 0o755); err != nil {
		return "", err
	}

	return dir, nil
}

// thumbCachePath returns the on-disk path for a studio thumbnail, derived
// from a hash of the normalized name so it is safe against path traversal
// and filesystem case-sensitivity differences.
func thumbCachePath(cacheDir, normalizedName string) string {
	sum := sha256.Sum256([]byte(normalizedName))
	filename := hex.EncodeToString(sum[:16]) + ".webp"
	return filepath.Join(cacheDir, filename)
}

// downloadStudioThumb fetches the thumbnail from the upstream source and
// writes it atomically to cachePath. A temp file in <cacheDir>/.tmp is used
// so partial writes are never visible under cachePath.
func downloadStudioThumb(studioName, cacheDir, cachePath string) error {
	escaped := url.PathEscape(studioName)
	if escaped == "" {
		return errors.New("invalid studio name")
	}
	thumbURL := thumbBaseURL + escaped + "/thumb.webp"

	req, err := http.NewRequest(http.MethodGet, thumbURL, nil)
	if err != nil {
		return err
	}

	resp, err := (&http.Client{Timeout: thumbsListRequestTimeout}).Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return fiber.ErrNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return errors.New("upstream returned status " + strconv.Itoa(resp.StatusCode))
	}

	tmpFile, err := os.CreateTemp(filepath.Join(cacheDir, thumbCacheTempSubdir), "thumb-*.webp")
	if err != nil {
		return err
	}
	tmpPath := tmpFile.Name()

	cleanup := func() {
		tmpFile.Close()
		os.Remove(tmpPath)
	}

	if _, err := io.Copy(tmpFile, resp.Body); err != nil {
		cleanup()
		return err
	}
	if err := tmpFile.Close(); err != nil {
		os.Remove(tmpPath)
		return err
	}

	if err := os.Rename(tmpPath, cachePath); err != nil {
		os.Remove(tmpPath)
		return err
	}

	return nil
}

func GetStudios(c fiber.Ctx) error {
	limit, err := parseStudiosLimit(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	hasThumbOnly, err := parseHasThumbOnly(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	jellyfinURL, token, err := parseJellyfinCredentials(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	studios, err := getStudiosWithCache(jellyfinURL, token)
	if err != nil {
		log.Printf("studios: failed loading studios: %v", err)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to load studios from Jellyfin: " + err.Error()})
	}

	if !hasThumbOnly {
		if len(studios) > limit {
			studios = studios[:limit]
		}
		return c.Status(fiber.StatusOK).JSON(studios)
	}

	thumbs, err := getThumbsListWithCache()
	if err != nil {
		log.Printf("studios: failed loading thumbs list: %v", err)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to load studio thumbnail metadata"})
	}

	filtered := make([]models.StudioSummary, 0, limit)
	for _, studio := range studios {
		if _, hasThumb := thumbs[normalizeStudioName(studio.Name)]; !hasThumb {
			continue
		}
		studio.HasThumb = true
		filtered = append(filtered, studio)
		if len(filtered) == limit {
			break
		}
	}

	return c.Status(fiber.StatusOK).JSON(filtered)
}

func GetStudioThumb(c fiber.Ctx) error {
	rawStudioName := strings.TrimSpace(c.Params("name"))
	studioName, unescapeErr := url.PathUnescape(rawStudioName)
	if unescapeErr != nil {
		studioName = rawStudioName
	}
	studioName = strings.TrimSpace(studioName)
	if studioName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Studio name is required"})
	}

	thumbs, err := getThumbsListWithCache()
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to load studio thumbnail metadata"})
	}

	normalized := normalizeStudioName(studioName)
	if _, ok := thumbs[normalized]; !ok {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Error: "Studio thumbnail not found"})
	}

	cacheDir, err := thumbCacheDir()
	if err != nil {
		log.Printf("studios: thumb cache dir unavailable: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Thumbnail cache unavailable"})
	}

	cachePath := thumbCachePath(cacheDir, normalized)

	// Fast path: cache hit.
	if _, statErr := os.Stat(cachePath); statErr == nil {
		c.Set("Content-Type", studioThumbContentType)
		c.Set("Cache-Control", studioThumbCacheControl)
		return c.SendFile(cachePath)
	} else if !errors.Is(statErr, os.ErrNotExist) {
		log.Printf("studios: thumb cache stat error for %q: %v", normalized, statErr)
	}

	// Cache miss: fetch via singleflight so concurrent requests for the same
	// studio collapse into a single upstream fetch.
	_, err, _ = thumbFetchGroup.Do(normalized, func() (interface{}, error) {
		// Re-check inside the singleflight in case another goroutine just wrote it.
		if _, statErr := os.Stat(cachePath); statErr == nil {
			return nil, nil
		}
		return nil, downloadStudioThumb(studioName, cacheDir, cachePath)
	})

	if err != nil {
		if errors.Is(err, fiber.ErrNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{Error: "Studio thumbnail not found"})
		}
		log.Printf("studios: thumb fetch failed for %q: %v", normalized, err)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to fetch studio thumbnail"})
	}

	log.Printf("studios: cached thumbnail for %q", normalized)

	c.Set("Content-Type", studioThumbContentType)
	c.Set("Cache-Control", studioThumbCacheControl)
	return c.SendFile(cachePath)
}
