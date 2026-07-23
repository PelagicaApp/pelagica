package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const (
	studioLogoCacheControl   = "public, max-age=86400"
	defaultStudioLogoSize    = "w300"
	tmdbImageBaseURL         = "https://image.tmdb.org/t/p/"
	studioLogoRequestTimeout = 10 * time.Second
	defaultMonoLogoColor     = "ffffff"
	defaultMonoLogoColor2    = "bababa"
)

var hexColorPattern = regexp.MustCompile(`^[0-9a-fA-F]{6}$`)

var validStudioLogoSizes = map[string]struct{}{
	"w45":      {},
	"w92":      {},
	"w154":     {},
	"w185":     {},
	"w300":     {},
	"w500":     {},
	"original": {},
}

func monoLogoFilter(color, color2 string) string {
	return "_filter(duotone," + color + "," + color2 + ")"
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func parseHexColorQuery(query url.Values, name, fallback string) (string, error) {
	raw := strings.TrimSpace(strings.TrimPrefix(query.Get(name), "#"))
	if raw == "" {
		return fallback, nil
	}
	if !hexColorPattern.MatchString(raw) {
		return "", &invalidQueryParamError{name}
	}
	return strings.ToLower(raw), nil
}

type invalidQueryParamError struct{ name string }

func (e *invalidQueryParamError) Error() string {
	return e.name + " must be a 6-digit hex value"
}

func handleStudioLogo(w http.ResponseWriter, r *http.Request) {
	rawStudioName := strings.TrimSpace(r.PathValue("name"))
	studioName, err := url.PathUnescape(rawStudioName)
	if err != nil {
		studioName = rawStudioName
	}
	studioName = strings.TrimSpace(studioName)
	if studioName == "" {
		writeJSONError(w, http.StatusBadRequest, "Studio name is required")
		return
	}

	query := r.URL.Query()

	size := strings.TrimSpace(query.Get("size"))
	if size == "" {
		size = defaultStudioLogoSize
	}
	if _, ok := validStudioLogoSizes[size]; !ok {
		writeJSONError(w, http.StatusBadRequest, "Invalid size parameter")
		return
	}

	mono := false
	if raw := strings.TrimSpace(query.Get("mono")); raw != "" {
		parsed, err := strconv.ParseBool(raw)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "mono must be true or false")
			return
		}
		mono = parsed
	}

	monoColor, err := parseHexColorQuery(query, "color", defaultMonoLogoColor)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}
	monoColor2, err := parseHexColorQuery(query, "color2", defaultMonoLogoColor2)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	logo, err := getStudioLogo(studioName)
	if err != nil {
		log.Printf("studio logo: failed to query %q: %v", studioName, err)
		writeJSONError(w, http.StatusBadGateway, "Failed to load studio logo data")
		return
	}
	if logo == nil {
		writeJSONError(w, http.StatusNotFound, "Studio logo not found")
		return
	}

	sizeSegment := size
	if mono {
		sizeSegment += monoLogoFilter(monoColor, monoColor2)
	}
	tmdbURL := tmdbImageBaseURL + sizeSegment + logo.LogoPath

	req, err := http.NewRequest(http.MethodGet, tmdbURL, nil)
	if err != nil {
		log.Printf("studio logo: failed to build TMDB request: %v", err)
		writeJSONError(w, http.StatusInternalServerError, "Failed to fetch studio logo")
		return
	}

	resp, err := (&http.Client{Timeout: studioLogoRequestTimeout}).Do(req)
	if err != nil {
		log.Printf("studio logo: failed to fetch %q from TMDB: %v", studioName, err)
		writeJSONError(w, http.StatusBadGateway, "Failed to fetch studio logo")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		writeJSONError(w, http.StatusNotFound, "Studio logo not found")
		return
	}
	if resp.StatusCode != http.StatusOK {
		log.Printf("studio logo: unexpected status %d from TMDB for %q", resp.StatusCode, studioName)
		writeJSONError(w, http.StatusBadGateway, "Failed to fetch studio logo")
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("studio logo: failed to read TMDB response for %q: %v", studioName, err)
		writeJSONError(w, http.StatusBadGateway, "Failed to fetch studio logo")
		return
	}

	if contentType := resp.Header.Get("Content-Type"); contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}
	w.Header().Set("Cache-Control", studioLogoCacheControl)
	_, _ = w.Write(body)
}
