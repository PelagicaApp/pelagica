const EXPANDED_BEFORE_BROWSE_KEY = 'pelagica_sidebar_expanded_before_browse';

export function readExpandedBeforeBrowse(): boolean {
    try {
        return sessionStorage.getItem(EXPANDED_BEFORE_BROWSE_KEY) === 'true';
    } catch {
        return false;
    }
}

export function saveExpandedBeforeBrowse(expanded: boolean) {
    try {
        sessionStorage.setItem(EXPANDED_BEFORE_BROWSE_KEY, String(expanded));
    } catch {
        // ignore
    }
}
