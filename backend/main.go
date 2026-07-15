package main

import (
	"log/slog"
	"os"
	"pelagica-backend/appconfig"
	"pelagica-backend/collector"
	"pelagica-backend/handlers"
	"pelagica-backend/logging"
	"strings"

	"github.com/gofiber/fiber/v3"
)

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "4321"
	}
	return ":" + port
}

func isAuthEnabled() bool {
	enableAuth := os.Getenv("ENABLE_AUTH")
	return strings.ToLower(enableAuth) == "true"
}

func main() {
	logging.Setup()

	app := fiber.New()
	appconfig.Setup(app)

	job := collector.RegisterStatsJob()
	if job != nil {
		defer job.Stop()
	}

	var protected fiber.Handler
	if isAuthEnabled() {
		protected = handlers.AuthMiddleware
	} else {
		slog.Warn("Authentication is disabled. All protected endpoints are publicly accessible.")
		protected = func(c fiber.Ctx) error { return c.Next() }
	}

	api := app.Group("/api")

	api.Get("/config", handlers.GetConfig)
	api.Post("/config", protected, handlers.UpdateConfig)
	api.Get("/branding/logo/:mode", handlers.GetBrandingLogo)
	api.Post("/branding/logo/:mode", protected, handlers.UploadBrandingLogo)
	api.Delete("/branding/logo/:mode", protected, handlers.ResetBrandingLogo)

	api.Get("/themes", handlers.GetThemes)
	api.Post("/themes", protected, handlers.CreateTheme)
	api.Get("/themes/:id", handlers.GetTheme)
	api.Put("/themes/:id", protected, handlers.UpdateTheme)
	api.Delete("/themes/:id", protected, handlers.DeleteTheme)
	api.Post("/themes/:id/install", protected, handlers.InstallTheme)

	api.Get("/studios", handlers.GetStudios)
	api.Get("/studios/:name/thumb", handlers.GetStudioThumb)

	api.Get("/stats-consent", handlers.GetStatsConsent)
	api.Post("/stats-consent", handlers.PostStatsConsent)

	api.Post("/seerr/login", handlers.SeerLogin)
	api.Post("/seerr/logout", handlers.SeerLogout)
	api.Get("/seerr/movie/:tmdbId/recommendations", handlers.GetSeerMovieRecommendations)
	api.Get("/seerr/tv/:tvId/recommendations", handlers.GetSeerTvRecommendations)
	api.Get("/seerr/movie/:tmdbId", handlers.GetSeerMovieDetails)
	api.Get("/seerr/tv/:tvId", handlers.GetSeerTvDetails)
	api.Post("/seerr/request", handlers.PostSeerRequest)
	api.Get("/seerr/search", handlers.GetSeerSearch)
	api.Get("/seerr/status", handlers.GetSeerrStatus)

	slog.Info("Server starting", "port", getPort(), "fiber", fiber.Version)
	if err := app.Listen(getPort(), fiber.ListenConfig{
		DisableStartupMessage: true,
	}); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}
