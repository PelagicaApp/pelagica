export function buildPlayerUrl(itemId: string, backUrl?: string | null): string {
    if (backUrl) {
        return `/player/${itemId}?backUrl=${encodeURIComponent(backUrl)}`;
    }
    return `/player/${itemId}`;
}
