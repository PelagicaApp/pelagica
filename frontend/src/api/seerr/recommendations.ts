import { getServerUrl } from '@/utils/localstorageCredentials';
import type {
    SeerrMediaType,
    SeerrMovieRecommendationsResponse,
    SeerrRecommendationItem,
    SeerrTvRecommendationsResponse,
} from './types';

export async function getSeerrMovieRecommendations(
    tmdbId: string
): Promise<SeerrRecommendationItem[]> {
    const response = await fetch(
        `/api/seerr/movie/${tmdbId}/recommendations?jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    const data: SeerrMovieRecommendationsResponse = await response.json();
    return data.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate,
        mediaInfo: movie.mediaInfo,
    }));
}

export async function getSeerrTvRecommendations(tvId: string): Promise<SeerrRecommendationItem[]> {
    const response = await fetch(
        `/api/seerr/tv/${tvId}/recommendations?jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    const data: SeerrTvRecommendationsResponse = await response.json();
    return data.results.map((show) => ({
        id: show.id,
        title: show.name,
        posterPath: show.posterPath,
        releaseDate: show.firstAirDate,
        mediaInfo: show.mediaInfo,
    }));
}

export function getSeerrRecommendations(
    mediaType: SeerrMediaType,
    id: string
): Promise<SeerrRecommendationItem[]> {
    return mediaType === 'movie' ? getSeerrMovieRecommendations(id) : getSeerrTvRecommendations(id);
}
