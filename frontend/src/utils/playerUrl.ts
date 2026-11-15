export function buildPlayerUrl(itemId: string, backUrl?: string, startTicks?: number): string {
    const params = new URLSearchParams();
    if (backUrl) params.set('backUrl', backUrl);
    if (startTicks && startTicks > 0) params.set('startTicks', String(Math.floor(startTicks)));

    const query = params.toString();
    return query ? `/play/${itemId}?${query}` : `/play/${itemId}`;
}
