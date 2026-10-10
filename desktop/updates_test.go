package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wailsapp/wails/v3/pkg/updater"
	"github.com/wailsapp/wails/v3/pkg/updater/providers/github"
)

func TestDesktopUpdateAsset(t *testing.T) {
	for _, tc := range []struct {
		name, arch string
		size       int64
		want       int
	}{
		{"pelagica-macos-arm64-v4.12.0.dmg", "arm64", 10, 0},
		{"pelagica-macos-amd64-4.12.0.dmg", "amd64", 10, 0},
		{"pelagica-macos-arm64-v4.12.0.dmg", "amd64", 10, -1},
		{"pelagica-macos-arm64-v4.12.0.zip", "arm64", 10, -1},
		{"pelagica-macos-arm64-v4.12.0.dmg", "arm64", 0, -1},
		{"pelagica-macos-universal-v4.12.0.dmg", "arm64", 10, -1},
	} {
		t.Run(tc.name+tc.arch, func(t *testing.T) {
			got := desktopUpdateAsset(updater.CheckRequest{Platform: "darwin", Arch: tc.arch}, []github.ReleaseAsset{{Name: tc.name, Size: tc.size}})
			if got != tc.want {
				t.Fatalf("got %d, want %d", got, tc.want)
			}
		})
	}
}

func TestCheckDesktopUpdate(t *testing.T) {
	for _, tc := range []struct {
		name, current, tag, asset string
		prerelease                bool
		status                    int
		malformed, want, wantErr  bool
	}{
		{name: "newer", current: "v4.9.0", tag: "v4.12.0", want: true},
		{name: "equal", current: "4.12.0", tag: "v4.12.0"},
		{name: "older", current: "4.12.1", tag: "v4.12.0"},
		{name: "major", current: "4.12.0", tag: "5.0.0", want: true},
		{name: "prerelease flag", current: "4.11.0", tag: "v4.12.0", prerelease: true},
		{name: "prerelease tag", current: "4.11.0", tag: "v4.12.0-rc.1"},
		{name: "invalid tag", current: "4.11.0", tag: "invalid"},
		{name: "development", current: "0.0.0", tag: "v4.12.0", wantErr: true},
		{name: "missing current", tag: "v4.12.0", wantErr: true},
		{name: "missing release version", current: "4.11.0"},
		{name: "missing installer", current: "4.11.0", tag: "v4.12.0", asset: "README.txt", wantErr: true},
		{name: "invalid current", current: "unknown", tag: "v4.12.0", wantErr: true},
		{name: "wrong arch", current: "4.11.0", tag: "v4.12.0", asset: "pelagica-macos-amd64-v4.12.0.dmg", wantErr: true},
		{name: "mismatched tag", current: "4.11.0", tag: "v4.12.0", asset: "pelagica-macos-arm64-v4.11.0.dmg", wantErr: true},
		{name: "GitHub forbidden", current: "4.11.0", status: 403, wantErr: true},
		{name: "rate limited", current: "4.11.0", status: 429, wantErr: true},
		{name: "server error", current: "4.11.0", status: 500, wantErr: true},
		{name: "no release", current: "4.11.0", status: 404},
		{name: "invalid JSON", current: "4.11.0", malformed: true, wantErr: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != "/repos/PelagicaApp/pelagica/releases/latest" {
					t.Errorf("unexpected request: %s", r.URL.Path)
				}
				if tc.status != 0 {
					w.WriteHeader(tc.status)
					return
				}
				if tc.malformed {
					_, _ = w.Write([]byte("not json"))
					return
				}
				asset := tc.asset
				if asset == "" {
					asset = "pelagica-macos-arm64-" + tc.tag + ".dmg"
				}
				_ = json.NewEncoder(w).Encode(map[string]any{"tag_name": tc.tag, "prerelease": tc.prerelease, "html_url": "https://untrusted.invalid", "assets": []map[string]any{{"name": asset, "size": 100}}})
			}))
			defer server.Close()
			provider, err := github.New(github.Config{Repository: "PelagicaApp/pelagica", BaseURL: server.URL, AssetMatcher: desktopUpdateAsset})
			if err != nil {
				t.Fatal(err)
			}
			notice, err := checkDesktopUpdate(context.Background(), provider, tc.current, "darwin", "arm64")
			if (err != nil) != tc.wantErr {
				t.Fatalf("error=%v, wantErr=%v", err, tc.wantErr)
			}
			if (notice != nil) != tc.want {
				t.Fatalf("notice=%v, want=%v", notice, tc.want)
			}
			if notice != nil && notice.URL != releasesURL+"/tag/"+tc.tag {
				t.Fatalf("unsafe release URL: %s", notice.URL)
			}
		})
	}
}

func TestDesktopPlatforms(t *testing.T) {
	for _, tc := range []struct{ platform, arch, asset string }{
		{"darwin", "arm64", "pelagica-macos-arm64-v4.12.0.dmg"},
		{"darwin", "amd64", "pelagica-macos-amd64-v4.12.0.dmg"},
		{"windows", "amd64", "pelagica-windows-amd64-installer-v4.12.0.exe"},
		{"linux", "amd64", "pelagica-linux-amd64-v4.12.0.deb"},
		{"linux", "amd64", "pelagica-linux-amd64-v4.12.0.pkg.tar.zst"},
		{"linux", "amd64", "pelagica-linux-amd64-v4.12.0.AppImage"},
	} {
		t.Run(tc.asset, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != "/repos/PelagicaApp/pelagica/releases/latest" {
					t.Errorf("unexpected request: %s", r.URL.Path)
				}
				_ = json.NewEncoder(w).Encode(map[string]any{"tag_name": "v4.12.0", "assets": []map[string]any{{"name": tc.asset, "size": 100}}})
			}))
			defer server.Close()
			provider, err := github.New(github.Config{Repository: "PelagicaApp/pelagica", BaseURL: server.URL, AssetMatcher: desktopUpdateAsset})
			if err != nil {
				t.Fatal(err)
			}
			notice, err := checkDesktopUpdate(context.Background(), provider, "4.11.0", tc.platform, tc.arch)
			if err != nil || notice == nil || notice.URL != releasesURL+"/tag/v4.12.0" {
				t.Fatalf("notice=%v, error=%v", notice, err)
			}
			assets := []github.ReleaseAsset{{Name: tc.asset, Size: 100}}
			if desktopUpdateAsset(updater.CheckRequest{Platform: tc.platform, Arch: tc.arch}, assets) != 0 {
				t.Fatal("compatible asset rejected")
			}
			if desktopUpdateAsset(updater.CheckRequest{Platform: tc.platform, Arch: "unsupported"}, assets) != -1 {
				t.Fatal("unsupported architecture accepted")
			}
		})
	}
}

func TestCheckCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	provider, err := github.New(github.Config{Repository: "PelagicaApp/pelagica", BaseURL: "http://127.0.0.1:1", AssetMatcher: desktopUpdateAsset})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := checkDesktopUpdate(ctx, provider, "4.11.0", "darwin", "arm64"); err == nil {
		t.Fatal("cancelled check succeeded")
	}
}
