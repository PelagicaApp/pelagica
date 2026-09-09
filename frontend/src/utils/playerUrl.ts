export interface PlayerTrackSelection {
    /** Absolute MediaStream.Index of the audio track to start with */
    audioIndex?: number;
    /** Position within the item's subtitle streams; null starts with subtitles disabled */
    subtitleIndex?: number | null;
}

export function buildPlayerUrl(
    itemId: string,
    backUrl?: string,
    tracks?: PlayerTrackSelection
): string {
    const params = new URLSearchParams();
    if (backUrl) {
        params.set('backUrl', backUrl);
    }
    if (tracks?.audioIndex !== undefined) {
        params.set('audio', String(tracks.audioIndex));
    }
    if (tracks !== undefined && tracks.subtitleIndex !== undefined) {
        params.set(
            'subtitle',
            tracks.subtitleIndex === null ? 'none' : String(tracks.subtitleIndex)
        );
    }
    const query = params.toString();
    return query ? `/play/${itemId}?${query}` : `/play/${itemId}`;
}
