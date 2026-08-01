#!/bin/sh
set -e

APP_BIN="pelagica"
APPARMOR_PROFILE="/etc/apparmor.d/${APP_BIN}"

case "$1" in
    remove|purge)
        if [ -f "${APPARMOR_PROFILE}" ]; then
            echo "Removing AppArmor profile for ${APP_BIN}..."
            rm -f "${APPARMOR_PROFILE}"
            if command -v apparmor_parser >/dev/null 2>&1; then
                apparmor_parser -R "${APPARMOR_PROFILE}" 2>/dev/null || true
            elif command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet apparmor 2>/dev/null; then
                systemctl reload apparmor || true
            fi
        fi
        ;;
esac

exit 0