package handlers

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"pelagica-backend/models"

	"github.com/gofiber/fiber/v3"
)

func resolveBrandingLogoMode(mode string) (string, error) {
	switch mode {
	case "light", "dark":
		return mode, nil
	default:
		return "", errors.New("mode must be either light or dark")
	}
}

func brandingLogoPath(serverKey, mode string) string {
	return filepath.Join(serverDataDir(serverKey), "branding", "logo-"+mode)
}

// Still here for backward compatibility. Logos are now stored through the plugin on Jellyfin server
func GetBrandingLogo(c fiber.Ctx) error {
	mode, err := resolveBrandingLogoMode(c.Params("mode"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	serverKey, err := serverKeyFromRequest(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: err.Error()})
	}

	logoData, err := os.ReadFile(brandingLogoPath(serverKey, mode))
	if err != nil {
		if os.IsNotExist(err) {
			return c.Status(fiber.StatusNotFound).JSON(models.APIError{Error: "Logo not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to load logo"})
	}

	c.Set("Content-Type", http.DetectContentType(logoData))
	return c.Send(logoData)
}
