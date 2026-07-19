#!/bin/sh
set -e

APP_BIN="pelagica"
APP_PATH="/usr/local/bin/${APP_BIN}"
APPARMOR_PROFILE="/etc/apparmor.d/${APP_BIN}"

# Update desktop database for .desktop file changes
# This makes the application appear in application menus and registers its capabilities.
if command -v update-desktop-database >/dev/null 2>&1; then
    echo "Updating desktop database..."
    update-desktop-database -q /usr/share/applications
else
    echo "Warning: update-desktop-database command not found. Desktop file may not be immediately recognized." >&2
fi

# Update icon cache so the new app icon shows up immediately.
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    echo "Updating icon cache..."
    gtk-update-icon-cache -q /usr/share/icons/hicolor 2>/dev/null || true
fi

# Install AppArmor profile
if [ -d /etc/apparmor.d ]; then
    echo "Installing AppArmor profile for ${APP_BIN}..."
    cat > "${APPARMOR_PROFILE}" <<EOF
abi <abi/4.0>,
include <tunables/global>

profile ${APP_BIN} ${APP_PATH} flags=(unconfined) {
  userns,
  include if exists <local/${APP_BIN}>
}
EOF

    if command -v apparmor_parser >/dev/null 2>&1; then
        apparmor_parser -r "${APPARMOR_PROFILE}" 2>/dev/null || true
    elif command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet apparmor 2>/dev/null; then
        systemctl reload apparmor || true
    fi
else
    echo "AppArmor not present, skipping profile installation." >&2
fi

exit 0