package handlers

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"

	"pelagica-backend/models"

	"github.com/gofiber/fiber/v3"
)

func configFilePath(serverKey string) string {
	return filepath.Join(serverDataDir(serverKey), "config.json")
}

func GetConfig(c fiber.Ctx) error {
	var cfg models.AppConfig

	if serverKey, err := serverKeyFromRequest(c); err == nil {
		data, err := os.ReadFile(configFilePath(serverKey))
		if err != nil {
			if !os.IsNotExist(err) {
				slog.Error("Failed to read config file", "error", err)
				return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to read config file"})
			}
		} else if err := json.Unmarshal(data, &cfg); err != nil {
			slog.Error("Failed to parse config file", "error", err)
			return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to parse config file"})
		}
	}

	out, err := json.MarshalIndent(cfg, "", "    ")
	if err != nil {
		slog.Error("Failed to encode config", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to encode config"})
	}

	return c.Status(fiber.StatusOK).
		Type("json").
		Send(out)
}

func GetServerAddress(c fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"serverAddress": os.Getenv("SERVER_ADDRESS"),
	})
}
