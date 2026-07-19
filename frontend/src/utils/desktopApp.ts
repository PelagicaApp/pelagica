// Wails desktop webview appends "wails.io" to the user agent, which lets us detect if we're running in the desktop app or in a browser.
export function isDesktopApp(): boolean {
    return typeof navigator !== 'undefined' && navigator.userAgent.includes('wails.io');
}

const isDesktopBuild = import.meta.env.VITE_IS_DESKTOP_BUILD === 'true';

export async function hideTrafficLights(): Promise<void> {
    if (!isDesktopBuild || !isDesktopApp()) return;
    const { WindowService } = await import('@/bindings/pelagica-desktop');
    await WindowService.HideTrafficLights();
}

export async function showTrafficLights(): Promise<void> {
    if (!isDesktopBuild || !isDesktopApp()) return;
    const { WindowService } = await import('@/bindings/pelagica-desktop');
    await WindowService.ShowTrafficLights();
}
