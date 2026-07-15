import { getServerUrl } from '@/utils/localstorageCredentials';
import type {
    SeerrItemDetails,
    SeerrMediaType,
    SeerrMovieDetailsResponse,
    SeerrTvDetailsResponse,
} from './types';

export async function getSeerrItemDetails(
    mediaType: SeerrMediaType,
    id: number
): Promise<SeerrItemDetails> {
    const response = await fetch(
        `/api/seerr/${mediaType}/${id}?jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    if (mediaType === 'movie') {
        const data: SeerrMovieDetailsResponse = await response.json();
        return {
            id: data.id,
            mediaType,
            title: data.title,
            overview: data.overview,
            posterPath: data.posterPath,
            releaseDate: data.releaseDate,
            mediaInfo: data.mediaInfo,
            genres: data.genres,
            relatedVideos: data.relatedVideos,
        };
    }

    const data: SeerrTvDetailsResponse = await response.json();
    return {
        id: data.id,
        mediaType,
        title: data.name,
        overview: data.overview,
        posterPath: data.posterPath,
        releaseDate: data.firstAirDate,
        mediaInfo: data.mediaInfo,
        genres: data.genres,
        relatedVideos: data.relatedVideos,
    };
}
