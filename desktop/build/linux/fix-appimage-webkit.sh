#!/bin/sh
set -eu

appimage="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
arch="$(uname -m)"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

cd "$workdir"
"$appimage" --appimage-extract >/dev/null
appdir="$workdir/squashfs-root"

binary="$appdir/usr/bin/pelagica"
real_binary="$appdir/usr/bin/pelagica.bin"
mv "$binary" "$real_binary"

cat >"$binary" <<'EOF'
#!/bin/sh
here="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
appdir="$(cd "$here/../.." && pwd)"
webkit_proc="$(find "$appdir/usr/lib" -name WebKitNetworkProcess 2>/dev/null | head -n1)"
if [ -n "$webkit_proc" ]; then
    export WEBKIT_EXEC_PATH="$(dirname "$webkit_proc")"
fi
export WEBKIT_DISABLE_SANDBOX=1
exec "$here/pelagica.bin" "$@"
EOF
chmod +x "$binary"

appimagetool="$workdir/appimagetool.AppImage"
curl -fsSL -o "$appimagetool" "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-${arch}.AppImage"
chmod +x "$appimagetool"

rm -f "$appimage"
ARCH="$arch" "$appimagetool" --appimage-extract-and-run "$appdir" "$appimage"
chmod +x "$appimage"
