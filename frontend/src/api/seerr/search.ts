import { getServerUrl } from '@/utils/localstorageCredentials';
import type { SeerrSearchResponse, SeerrSearchResultItem } from './types';

export async function searchSeerr(query: string): Promise<SeerrSearchResultItem[]> {
    const response = await fetch(
        `/api/seerr/search?query=${encodeURIComponent(query)}&jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    const data: SeerrSearchResponse = await response.json();
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
