export interface SeerrDiscoverSlider {
    id: number;
    type: number;
    order: number;
    isBuiltIn: boolean;
    enabled: boolean;
    title?: string | null;
    data?: string | null;
}

export interface SeerrResolvedSlider {
    id: number;
    type: number;
    title: string;
    /** Path after `/api/v1/`, e.g. `discover/movies`. */
    path: string;
    query?: Record<string, string>;
    linkPath: string;
    mediaTypeHint?: 'movie' | 'tv';
}

export type SeerrSliderResolveResult =
    | { kind: 'titles'; slider: SeerrResolvedSlider }
    | { kind: 'skip' }
    | { kind: 'unknown' };

const extraEncodes: [RegExp, string][] = [
    [/\(/g, '%28'],
    [/\)/g, '%29'],
    [/!/g, '%21'],
    [/\*/g, '%2A'],
];

export function encodeSeerrQueryValue(value: string): string {
    let encoded = encodeURIComponent(value);
    extraEncodes.forEach(([pattern, replacement]) => {
        encoded = encoded.replace(pattern, replacement);
    });
    return encoded;
}

export function todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function withTitle(slider: SeerrDiscoverSlider, fallback: string): string {
    const title = slider.title?.trim();
    return title || fallback;
}

function mediaTypeHintFromPath(path: string): 'movie' | 'tv' | undefined {
    if (path === 'discover/movies' || path.startsWith('discover/movies/')) return 'movie';
    if (path === 'discover/tv' || path.startsWith('discover/tv/')) return 'tv';
    return undefined;
}

export function titleSlider(
    slider: SeerrDiscoverSlider,
    path: string,
    linkPath: string,
    fallbackTitle: string,
    query?: Record<string, string>
): SeerrSliderResolveResult {
    return {
        kind: 'titles',
        slider: {
            id: slider.id,
            type: slider.type,
            title: withTitle(slider, fallbackTitle),
            path,
            query,
            linkPath,
            mediaTypeHint: mediaTypeHintFromPath(path),
        },
    };
}
