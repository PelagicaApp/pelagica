package handlers

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v3"
)

func serversDir() string {
	dir := os.Getenv("SERVERS_DIR")
	if dir == "" {
		dir = "servers"
	}
	return dir
}

// serverKeyFromURL derives a filesystem-safe key from a Jellyfin server URL
// host (hostname + optional port), used to namespace per-server storage
func serverKeyFromURL(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", errors.New("missing jellyfin_url query parameter")
	}

	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" {
		return "", errors.New("invalid jellyfin_url")
	}

	host := strings.ToLower(parsed.Host)

	// Build an injective mapping from host to key: allowed characters pass
	// through unchanged, everything else (including a literal underscore) is
	// hex-escaped as "_XX". Two different hosts can never collide onto the
	// same key, since the escape sequence is unambiguous.
	var key strings.Builder
	for i := 0; i < len(host); i++ {
		b := host[i]
		switch {
		case b >= 'a' && b <= 'z', b >= '0' && b <= '9', b == '.', b == '-':
			key.WriteByte(b)
		default:
			fmt.Fprintf(&key, "_%02x", b)
		}
	}

	if strings.Trim(key.String(), ".") == "" {
		return "", errors.New("invalid jellyfin_url")
	}

	return key.String(), nil
}

func serverKeyFromRequest(c fiber.Ctx) (string, error) {
	return serverKeyFromURL(c.Query("jellyfin_url"))
}

func serverDataDir(serverKey string) string {
	return filepath.Join(serversDir(), serverKey)
}
