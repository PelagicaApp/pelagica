package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"pelagica-backend/services"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"pelagica-backend/models"
)

func themesDir() string {
	dir := os.Getenv("THEMES_DIR")
	if dir == "" {
		dir = "themes"
	}
	return dir
}

var themeStore *services.ThemeStore

func InitThemeStore() {
	store, err := services.NewThemeStore(themesDir())
	if err != nil {
		panic(err)
	}
	themeStore = store
}

func GetThemes(c fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(themeStore.GetAll())
}

func GetTheme(c fiber.Ctx) error {
	id := c.Params("id", "")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Theme ID is required"})
	}

	theme, err := themeStore.Get(id)
	if err != nil {
		slog.Error("Failed to retrieve theme", "error", err)
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Error: "Theme not found"})
	}

	return c.Status(fiber.StatusOK).JSON(theme)
}

func CreateTheme(c fiber.Ctx) error {
	var theme models.Theme

	if err := c.Bind().Body(&theme); err != nil {
		slog.Error("Failed to decode theme", "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Failed to decode theme"})
	}

	if err := theme.Validate(); err != nil {
		slog.Warn("Theme validation error", "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Invalid theme: " + err.Error()})
	}

	id, err := themeStore.Write(uuid.New().String(), theme)
	if err != nil {
		slog.Error("Failed to write theme", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to save theme"})
	}

	slog.Info("Theme created", "name", theme.Name, "id", id)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"id": id})
}

func UpdateTheme(c fiber.Ctx) error {
	id := c.Params("id", "")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Theme ID is required"})
	}

	var theme models.Theme

	if err := c.Bind().Body(&theme); err != nil {
		slog.Error("Failed to decode theme", "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Failed to decode theme"})
	}

	if err := theme.Validate(); err != nil {
		slog.Warn("Theme validation error", "error", err)
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Invalid theme: " + err.Error()})
	}

	_, err := themeStore.Write(id, theme)
	if err != nil {
		slog.Error("Failed to update theme", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to update theme"})
	}

	slog.Info("Theme updated", "id", id)

	return c.SendStatus(fiber.StatusNoContent)
}

func InstallTheme(c fiber.Ctx) error {
	id := c.Params("id", "")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Theme ID is required"})
	}

	repoBaseUrl := os.Getenv("THEMES_REPO_BASE_URL")
	if repoBaseUrl == "" {
		repoBaseUrl = "https://themes.pelagica.app/"
	}

	repoIndexUrl, err := url.JoinPath(repoBaseUrl, "index.json")
	if err != nil {
		slog.Error("Failed to construct repo index URL", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to construct theme repository URL"})
	}

	resp, err := http.Get(repoIndexUrl)
	if err != nil {
		slog.Error("Failed to fetch theme repo", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to fetch theme repository"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.Error("Unexpected status code from theme repo", "status", resp.StatusCode)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to fetch theme repository"})
	}

	var repo models.ThemeRepo
	if err := json.NewDecoder(resp.Body).Decode(&repo); err != nil {
		slog.Error("Failed to decode theme repo", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to decode theme repository"})
	}

	var themeURL string
	for _, t := range repo.Themes {
		if t.ID == id {
			themeURL, err = url.JoinPath(repoBaseUrl, t.Path)
			if err != nil {
				slog.Error("Failed to construct theme URL", "error", err)
				return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to construct theme URL"})
			}
			break
		}
	}

	if themeURL == "" {
		slog.Warn("Theme not found in repository", "id", id)
		return c.Status(fiber.StatusNotFound).JSON(models.APIError{Error: "Theme not found in repository"})
	}

	resp, err = http.Get(themeURL)
	if err != nil {
		slog.Error("Failed to fetch theme", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to fetch theme"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.Error("Unexpected status code when fetching theme", "status", resp.StatusCode)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to fetch theme"})
	}

	var theme models.Theme
	if err := json.NewDecoder(resp.Body).Decode(&theme); err != nil {
		slog.Error("Failed to decode theme", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to decode theme"})
	}

	if err := theme.Validate(); err != nil {
		slog.Warn("Theme validation error", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Invalid theme from repository: " + err.Error()})
	}

	newID, err := themeStore.Write(id, theme)
	if err != nil {
		slog.Error("Failed to save theme", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to save theme"})
	}

	slog.Info("Theme installed", "name", theme.Name, "id", newID)

	return c.SendStatus(fiber.StatusNoContent)
}

func DeleteTheme(c fiber.Ctx) error {
	id := c.Params("id", "")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIError{Error: "Theme ID is required"})
	}

	err := themeStore.Delete(id)
	if err != nil {
		slog.Error("Failed to delete theme", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to delete theme"})
	}

	slog.Info("Theme deleted", "id", id)

	return c.SendStatus(fiber.StatusNoContent)
}
