package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"regexp"
	"runtime"
	"slices"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/updater"
	"github.com/wailsapp/wails/v3/pkg/updater/providers/github"
)

const releasesURL = "https://github.com/PelagicaApp/pelagica/releases"

// Only production version tags are eligible; development builds cannot compare reliably.
var stableVersion = regexp.MustCompile(`^v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`)

type updateNotice struct {
	Version string `json:"version"`
	URL     string `json:"url"`
}

// Match only installer names produced by the existing release workflow.
func releaseAssetNames(platform, arch, tag string) []string {
	switch platform {
	case "darwin":
		if arch == "arm64" || arch == "amd64" {
			return []string{"pelagica-macos-" + arch + "-" + tag + ".dmg"}
		}
	case "windows":
		if arch == "amd64" {
			return []string{"pelagica-windows-amd64-installer-" + tag + ".exe"}
		}
	case "linux":
		if arch == "amd64" {
			return []string{
				"pelagica-linux-amd64-" + tag + ".deb",
				"pelagica-linux-amd64-" + tag + ".pkg.tar.zst",
				"pelagica-linux-amd64-" + tag + ".AppImage",
			}
		}
	}
	return nil
}

func desktopUpdateAsset(req updater.CheckRequest, assets []github.ReleaseAsset) int {
	for _, pattern := range releaseAssetNames(req.Platform, req.Arch, "TAG") {
		prefix, suffix, _ := strings.Cut(pattern, "TAG")
		for i, asset := range assets {
			tag := strings.TrimSuffix(strings.TrimPrefix(asset.Name, prefix), suffix)
			if strings.HasPrefix(asset.Name, prefix) && strings.HasSuffix(asset.Name, suffix) && tag != "" && asset.Size > 0 {
				return i
			}
		}
	}
	return -1
}

func checkDesktopUpdate(ctx context.Context, provider updater.Provider, version, platform, arch string) (*updateNotice, error) {
	if !stableVersion.MatchString(version) || strings.TrimPrefix(version, "v") == "0.0.0" {
		return nil, errors.New("update checks require a release build with a known version")
	}
	release, err := provider.Check(ctx, updater.CheckRequest{CurrentVersion: version, Platform: platform, Arch: arch})
	if err != nil || release == nil {
		return nil, err
	}
	if release.Channel != "stable" || !stableVersion.MatchString(release.Version) {
		return nil, nil
	}
	tag, ok := release.Metadata["github.release.tag"].(string)
	if !ok || !stableVersion.MatchString(tag) || strings.TrimPrefix(tag, "v") != release.Version {
		return nil, errors.New("invalid release tag")
	}
	if !slices.Contains(releaseAssetNames(platform, arch, tag), release.Artifact.Filename) {
		return nil, errors.New("release asset does not match its tag")
	}
	// Construct the destination ourselves, rather than opening URLs from release metadata.
	return &updateNotice{Version: release.Version, URL: releasesURL + "/tag/" + url.PathEscape(tag)}, nil
}

func registerUpdateRoutes(mux *http.ServeMux) {
	provider, err := github.New(github.Config{Repository: "PelagicaApp/pelagica", AssetMatcher: desktopUpdateAsset})
	if err != nil {
		panic(err)
	}
	mux.HandleFunc("GET /api/desktop/updates", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		notice, err := checkDesktopUpdate(r.Context(), provider, appVersion, runtime.GOOS, runtime.GOARCH)
		if err != nil {
			http.Error(w, "Unable to check for updates. Try again later or visit GitHub Releases.", http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(notice)
	})
}
