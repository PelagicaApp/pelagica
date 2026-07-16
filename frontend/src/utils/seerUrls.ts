import type { SeerrMediaType } from '../api/seerr/types';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

export interface SeerrItemUrlParams {
    seerrUrl: string;
    tmdbId: number;
    mediaType: SeerrMediaType;
}

export function getSeerrItemUrl({ seerrUrl, tmdbId, mediaType }: SeerrItemUrlParams): string {
    return `${seerrUrl.replace(/\/$/, '')}/${mediaType}/${tmdbId}`;
}

export function getSeerrItemPosterUrl(posterPath: string): string {
    return `${TMDB_POSTER_BASE}${posterPath}`;
}

export function getSeerrItemBackdropUrl(backdropPath: string): string {
    return `${TMDB_BACKDROP_BASE}${backdropPath}`;
}
