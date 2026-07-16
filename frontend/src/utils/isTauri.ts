import { isTauri as checkIsTauri } from '@tauri-apps/api/core';

export const isTauri = checkIsTauri;

// mpv's `--wid` window embedding (used by tauri-plugin-libmpv) doesn't work on
// macOS — mpv opens its own separate window instead of drawing into the given
// view — so the native player is only usable on Windows/Linux for now.
export const isMacOS = () => navigator.userAgent.includes('Macintosh');
