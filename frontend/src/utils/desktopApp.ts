export function isDesktopApp(): boolean {
    return typeof window !== 'undefined' && typeof (window as unknown as { _wails?: unknown })._wails !== 'undefined';
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

export async function minimiseWindow(): Promise<void> {
    if (!isDesktopBuild || !isDesktopApp()) return;
    const { WindowService } = await import('@/bindings/pelagica-desktop');
    await WindowService.Minimise();
}

export async function toggleMaximiseWindow(): Promise<void> {
    if (!isDesktopBuild || !isDesktopApp()) return;
    const { WindowService } = await import('@/bindings/pelagica-desktop');
    await WindowService.ToggleMaximise();
}

export async function isWindowMaximised(): Promise<boolean> {
    if (!isDesktopBuild || !isDesktopApp()) return false;
    const { WindowService } = await import('@/bindings/pelagica-desktop');
    return WindowService.IsMaximised();
}

export async function closeWindow(): Promise<void> {
    if (!isDesktopBuild || !isDesktopApp()) return;
    const { WindowService } = await import('@/bindings/pelagica-desktop');
    await WindowService.CloseWindow();
}

export function onWindowMaximiseChange(callback: (isMaximised: boolean) => void): () => void {
    if (!isDesktopBuild || !isDesktopApp()) return () => {};

    let cancelled = false;
    let unsubscribeMaximise: (() => void) | undefined;
    let unsubscribeUnMaximise: (() => void) | undefined;

    import('@wailsio/runtime').then(({ Events }) => {
        if (cancelled) return;
        unsubscribeMaximise = Events.On(Events.Types.Common.WindowMaximise, () => callback(true));
        unsubscribeUnMaximise = Events.On(Events.Types.Common.WindowUnMaximise, () =>
            callback(false)
        );
    });

    return () => {
        cancelled = true;
        unsubscribeMaximise?.();
        unsubscribeUnMaximise?.();
    };
}

export async function getAppIconOptions(): Promise<string[]> {
    if (!isDesktopBuild || !isDesktopApp()) return [];
    const { AppIconService } = await import('@/bindings/pelagica-desktop');
    return AppIconService.GetAppIconOptions();
}

export async function getAppIcon(): Promise<string | null> {
    if (!isDesktopBuild || !isDesktopApp()) return null;
    const { AppIconService } = await import('@/bindings/pelagica-desktop');
    return AppIconService.GetAppIcon();
}

export async function setAppIcon(name: string): Promise<void> {
    if (!isDesktopBuild || !isDesktopApp()) return;
    const { AppIconService } = await import('@/bindings/pelagica-desktop');
    await AppIconService.SetAppIcon(name);
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
