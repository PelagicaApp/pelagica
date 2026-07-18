// Wails desktop webview appends "wails.io" to the user agent, which lets us detect if we're running in the desktop app or in a browser.
export function isDesktopApp(): boolean {
    return typeof navigator !== 'undefined' && navigator.userAgent.includes('wails.io');
}
