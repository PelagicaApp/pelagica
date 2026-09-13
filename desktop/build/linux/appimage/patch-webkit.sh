#!/usr/bin/env bash
# Fixes a WebKitGTK crash-on-launch bug in AppImages produced by `wails3 generate appimage`.
# See: https://github.com/PelagicaApp/pelagica/issues/238
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <path-to-AppImage>" >&2
    exit 1
fi

APPIMAGE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"

case "$(uname -m)" in
    x86_64) ARCH=x86_64 ;;
    aarch64 | arm64) ARCH=aarch64 ;;
    *)
        echo "patch-webkit.sh: unsupported architecture $(uname -m)" >&2
        exit 1
        ;;
esac

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

APPIMAGETOOL="$WORKDIR/appimagetool"
curl -sL -o "$APPIMAGETOOL" "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-${ARCH}.AppImage"
chmod +x "$APPIMAGETOOL"

pushd "$WORKDIR" >/dev/null

chmod +x "$APPIMAGE"
"$APPIMAGE" --appimage-extract >/dev/null

find squashfs-root -type f \( -name 'libwebkitgtk*.so*' -o -name 'libwebkit2gtk*.so*' \) \
    -exec sed -i -e 's|/usr|././|g' '{}' +

rm -f repacked.AppImage
"$APPIMAGETOOL" --appimage-extract-and-run squashfs-root repacked.AppImage >/dev/null

popd >/dev/null

mv "$WORKDIR/repacked.AppImage" "$APPIMAGE"
chmod +x "$APPIMAGE"
