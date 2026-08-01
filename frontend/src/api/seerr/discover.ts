import { getServerUrl } from '@/utils/localstorageCredentials';
import type {
    SeerrMovieRecommendationsResponse,
    SeerrSearchResponse,
    SeerrSearchResultItem,
    SeerrTvRecommendationsResponse,
} from './types';

async function fetchSeerr<T>(path: string): Promise<T> {
    const response = await fetch(
        `${path}?jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
}

export async function getSeerrTrending(): Promise<SeerrSearchResultItem[]> {
    const data = await fetchSeerr<SeerrSearchResponse>('/api/seerr/discover/trending');
    return data.results
        .filter((result) => result.mediaType === 'movie' || result.mediaType === 'tv')
        .map((result) => ({
            id: result.id,
            mediaType: result.mediaType as 'movie' | 'tv',
            title: result.mediaType === 'movie' ? result.title || '' : result.name || '',
            posterPath: result.posterPath,
            releaseDate: result.mediaType === 'movie' ? result.releaseDate : result.firstAirDate,
            mediaInfo: result.mediaInfo,
        }));
}

export async function getSeerrPopularMovies(): Promise<SeerrSearchResultItem[]> {
    const data = await fetchSeerr<SeerrMovieRecommendationsResponse>('/api/seerr/discover/movies');
    return data.results.map((movie) => ({
        id: movie.id,
        mediaType: 'movie' as const,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate,
        mediaInfo: movie.mediaInfo,
    }));
}

export async function getSeerrPopularSeries(): Promise<SeerrSearchResultItem[]> {
    const data = await fetchSeerr<SeerrTvRecommendationsResponse>('/api/seerr/discover/tv');
    return data.results.map((show) => ({
        id: show.id,
        mediaType: 'tv' as const,
        title: show.name,
        posterPath: show.posterPath,
        releaseDate: show.firstAirDate,
        mediaInfo: show.mediaInfo,
    }));
}
