const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

function tmdbPath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
}

export function getSeerrItemPosterUrl(posterPath: string, size = 'w342'): string {
    if (isAbsoluteUrl(posterPath)) return posterPath;
    return `${TMDB_IMAGE_BASE}${size}${tmdbPath(posterPath)}`;
}

export function getSeerrItemBackdropUrl(backdropPath: string, size = 'w1280'): string {
    if (isAbsoluteUrl(backdropPath)) return backdropPath;
    return `${TMDB_IMAGE_BASE}${size}${tmdbPath(backdropPath)}`;
}
