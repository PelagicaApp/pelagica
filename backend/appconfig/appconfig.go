package appconfig

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
)

func Setup(app *fiber.App) {
	app.Use(func(c fiber.Ctx) error {
		c.Set("Content-Type", "application/json")
		return c.Next()
	})

	app.Use(func(c fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		slog.Debug("Request",
			"status", c.Response().StatusCode(),
			"method", c.Method(),
			"path", c.Path(),
			"latency", time.Since(start).String(),
			"ip", c.IP(),
		)
		return err
	})
}
