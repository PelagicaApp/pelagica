package handlers

import (
	"fmt"
	"pelagica-backend/collector"
	"pelagica-backend/models"

	"github.com/gofiber/fiber/v3"
)

func GetStatsConsent(c fiber.Ctx) error {
	consent := collector.HasStatsConsent()
	return c.JSON(fiber.Map{
		"consent": consent,
	})
}

func PostStatsConsent(c fiber.Ctx) error {
	consent := c.Query("consent", "false") == "true"
	err := collector.WriteStatsConsent(consent)
	if err != nil {
		fmt.Printf("Failed to save stats consent: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIError{Error: "Failed to save stats consent"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"consent": consent,
	})
}
