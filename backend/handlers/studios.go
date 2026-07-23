package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"pelagica-backend/models"
	"pelagica-backend/services"

	"github.com/gofiber/fiber/v3"
)

const (
	defaultStudiosCacheTTL    = 10 * time.Minute
	defaultStudiosLimit       = 20
	maxStudiosLimit           = 300
	defaultJellyfinPageSize   = 300
	jellyfinItemsRequestLimit = 30 * time.Second
	studioLogoCacheControl    = "public, max-age=86400"
	defaultStudioLogoSize     = "w300"
	tmdbImageBaseURL          = "https://image.tmdb.org/t/p/"
	studioLogoRequestTimeout  = 10 * time.Second
	defaultMonoLogoColor      = "ffffff"
	defaultMonoLogoColor2     = "bababa"
)

var hexColorPattern = regexp.MustCompile(`^[0-9a-fA-F]{6}$`)

func monoLogoFilter(color, color2 string) string {
	return "_filter(duotone," + color + "," + color2 + ")"
}

var validStudioLogoSizes = map[string]struct{}{
	"w45":      {},
	"w92":      {},
	"w154":     {},
	"w185":     {},
	"w300":     {},
	"w500":     {},
	"original": {},
}

type studiosCacheEntry struct {
	studios   []models.StudioSummary
	expiresAt time.Time
}

var studiosCache = struct {
	mu      sync.RWMutex
	entries map[string]studiosCacheEntry
}{
	entries: map[string]studiosCacheEntry{},
}

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

func parseHexColorQuery(c fiber.Ctx, name, fallback string) (string, error) {
	raw := strings.TrimSpace(strings.TrimPrefix(c.Query(name), "#"))
	if raw == "" {
		return fallback, nil
	}
	if !hexColorPattern.MatchString(raw) {
		return "", errors.New(name + " must be a 6-digit hex value")
	}
	return strings.ToLower(raw), nil
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

func parseStudiosStartIndex(c fiber.Ctx) (int, error) {
	raw := strings.TrimSpace(c.Query("startIndex"))
	if raw == "" {
		return 0, nil
	}

	startIndex, err := strconv.Atoi(raw)
	if err != nil {
		return 0, errors.New("startIndex must be a valid number")
	}

	if startIndex < 0 {
		return 0, errors.New("startIndex must be greater than or equal to 0")
	}

	return startIndex, nil
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

	slog.Debug("Studios aggregated", "count", len(studios))

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

func GetStudiosHealth(c fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
}

func GetStudios(c fiber.Ctx) error {
	limit, err := parseStudiosLimit(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	startIndex, err := parseStudiosStartIndex(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	search := strings.ToLower(strings.TrimSpace(c.Query("search")))

	jellyfinURL, token, err := parseJellyfinCredentials(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	studios, err := getStudiosWithCache(jellyfinURL, token)
	if err != nil {
		slog.Error("Failed to load studios", "error", err)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to load studios from Jellyfin: " + err.Error()})
	}

	if search != "" {
		filtered := make([]models.StudioSummary, 0, len(studios))
		for _, studio := range studios {
			if strings.Contains(strings.ToLower(studio.Name), search) {
				filtered = append(filtered, studio)
			}
		}
		studios = filtered
	}

	totalCount := len(studios)
	if startIndex > totalCount {
		startIndex = totalCount
	}
	end := startIndex + limit
	if end > totalCount {
		end = totalCount
	}

	return c.Status(fiber.StatusOK).JSON(models.StudiosPage{
		Items:      studios[startIndex:end],
		TotalCount: totalCount,
	})
}

func GetStudioLogo(c fiber.Ctx) error {
	rawStudioName := strings.TrimSpace(c.Params("name"))
	studioName, unescapeErr := url.PathUnescape(rawStudioName)
	if unescapeErr != nil {
		studioName = rawStudioName
	}
	studioName = strings.TrimSpace(studioName)
	if studioName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Studio name is required"})
	}

	size := strings.TrimSpace(c.Query("size"))
	if size == "" {
		size = defaultStudioLogoSize
	}
	if _, ok := validStudioLogoSizes[size]; !ok {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Invalid size parameter"})
	}

	mono := false
	if raw := strings.TrimSpace(c.Query("mono")); raw != "" {
		parsed, err := strconv.ParseBool(raw)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "mono must be true or false"})
		}
		mono = parsed
	}

	monoColor, err := parseHexColorQuery(c, "color", defaultMonoLogoColor)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}
	monoColor2, err := parseHexColorQuery(c, "color2", defaultMonoLogoColor2)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	logo, err := services.GetStudioLogo(studioName)
	if err != nil {
		slog.Error("Failed to query studio logo", "studio", studioName, "error", err)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to load studio logo data"})
	}
	if logo == nil {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Error: "Studio logo not found"})
	}

	sizeSegment := size
	if mono {
		sizeSegment += monoLogoFilter(monoColor, monoColor2)
	}
	tmdbURL := tmdbImageBaseURL + sizeSegment + logo.LogoPath

	req, err := http.NewRequest(http.MethodGet, tmdbURL, nil)
	if err != nil {
		slog.Error("Failed to build TMDB image request", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to fetch studio logo"})
	}

	resp, err := (&http.Client{Timeout: studioLogoRequestTimeout}).Do(req)
	if err != nil {
		slog.Error("Failed to fetch studio logo from TMDB", "studio", studioName, "error", err)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to fetch studio logo"})
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Error: "Studio logo not found"})
	}
	if resp.StatusCode != http.StatusOK {
		slog.Error("Unexpected status from TMDB", "studio", studioName, "status", resp.StatusCode)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to fetch studio logo"})
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		slog.Error("Failed to read studio logo response", "studio", studioName, "error", err)
		return c.Status(fiber.StatusBadGateway).JSON(models.APIError{Error: "Failed to fetch studio logo"})
	}

	if contentType := resp.Header.Get("Content-Type"); contentType != "" {
		c.Set("Content-Type", contentType)
	}
	c.Set("Cache-Control", studioLogoCacheControl)

	return c.Send(body)
}
