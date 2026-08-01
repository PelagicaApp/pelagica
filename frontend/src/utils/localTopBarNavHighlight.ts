const STORAGE_KEY = 'pelagica-topbar-nav-highlight';

export const TOP_BAR_NAV_HIGHLIGHT_CHANGE_EVENT = 'pelagica-topbar-nav-highlight-change';

export function getTopBarNavHighlight(): boolean {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) return false;
        return JSON.parse(stored) === true;
    } catch {
        return false;
    }
}

export function saveTopBarNavHighlight(enabled: boolean) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    window.dispatchEvent(
        new CustomEvent(TOP_BAR_NAV_HIGHLIGHT_CHANGE_EVENT, { detail: enabled })
    );
}
