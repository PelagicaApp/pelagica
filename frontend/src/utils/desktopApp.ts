// Wails desktop webview appends "wails.io" to the user agent, which lets us detect if we're running in the desktop app or in a browser.
export function isDesktopApp(): boolean {
    return typeof navigator !== 'undefined' && navigator.userAgent.includes('wails.io');
}

export function isMacOS(): boolean {
    return typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);
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

export async function toggleNativeFullscreen(): Promise<void> {
    if (!isDesktopBuild || !isDesktopApp()) return;
    const { WindowService } = await import('@/bindings/pelagica-desktop');
    await WindowService.ToggleFullscreen();
}

export function onNativeFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
    if (!isDesktopBuild || !isDesktopApp()) return () => {};

    let cancelled = false;
    let unsubscribeEnter: (() => void) | undefined;
    let unsubscribeExit: (() => void) | undefined;

    import('@wailsio/runtime').then(({ Events }) => {
        if (cancelled) return;
        unsubscribeEnter = Events.On(Events.Types.Common.WindowFullscreen, () => callback(true));
        unsubscribeExit = Events.On(Events.Types.Common.WindowUnFullscreen, () => callback(false));
    });

    return () => {
        cancelled = true;
        unsubscribeEnter?.();
        unsubscribeExit?.();
    };
}
