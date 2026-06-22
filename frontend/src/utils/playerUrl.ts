export function buildPlayerUrl(itemId: string, backUrl?: string): string {
    if (backUrl) {
        return `/play/${itemId}?backUrl=${encodeURIComponent(backUrl)}`;
    }
    return `/play/${itemId}`;
}
