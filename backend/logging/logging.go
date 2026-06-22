package logging

import (
	"io"
	"log/slog"
	"os"
	"strconv"
	"strings"

	"gopkg.in/natefinch/lumberjack.v2"
)

func envInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}

func Setup() {
	level := slog.LevelInfo

	switch strings.ToLower(os.Getenv("LOG_LEVEL")) {
	case "debug":
		level = slog.LevelDebug
	case "warn", "warning":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}

	var w io.Writer = os.Stdout

	logFile := strings.TrimSpace(os.Getenv("LOG_FILE"))
	if logFile != "" {
		fileWriter := &lumberjack.Logger{
			Filename:   logFile,
			MaxSize:    envInt("LOG_MAX_SIZE", 50),
			MaxAge:     envInt("LOG_MAX_AGE", 30),
			MaxBackups: envInt("LOG_MAX_BACKUPS", 5),
		}
		w = io.MultiWriter(os.Stdout, fileWriter)
	}

	slog.SetDefault(slog.New(slog.NewTextHandler(w, &slog.HandlerOptions{
		Level: level,
	})))
}
