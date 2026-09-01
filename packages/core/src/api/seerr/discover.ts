import { getServerUrl } from '../../utils/localstorageCredentials';
import type {
    SeerrMediaInfo,
    SeerrMediaType,
    SeerrMovieRecommendationsResponse,
    SeerrSearchResponse,
    SeerrSearchResultItem,
    SeerrTvRecommendationsResponse,
} from './types';
import { resolveDiscoverSlider } from './resolveDiscoverSlider.ts';
import type { SeerrDiscoverSlider, SeerrResolvedSlider } from './sliderResolve.ts';

async function fetchSeerr<T>(path: string): Promise<T> {
    const response = await fetch(
        `${path}?jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
}

async function fetchSeerrCatalog<T>(
    path: string,
    query?: Record<string, string>
): Promise<T> {
    const params = new URLSearchParams();
    params.set('path', path);
    params.set('jellyfin_url', getServerUrl() || '');
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            params.set(key, value);
        }
    }
    const response = await fetch(`/api/seerr/catalog?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
}

interface CatalogRawItem {
    id?: number;
    tmdbId?: number;
    mediaType?: string;
    title?: string;
    name?: string;
    posterPath?: string;
    image?: string;
    releaseDate?: string;
    firstAirDate?: string;
    mediaInfo?: SeerrMediaInfo;
    mappingState?: { state?: string };
    ratingKey?: string;
    source?: string;
}

function mapCatalogItem(
    raw: CatalogRawItem,
    mediaTypeHint?: SeerrMediaType
): SeerrSearchResultItem | null {
    if (!raw || raw.mediaType === 'person') return null;

    const mapping = raw.mappingState?.state;
    if (mapping === 'unmapped' || mapping === 'ambiguous' || mapping === 'pending') {
        return null;
    }

    const isProviderItem =
        raw.mappingState !== undefined ||
        raw.ratingKey !== undefined ||
        raw.source !== undefined ||
        typeof raw.tmdbId === 'number';

    const id = isProviderItem ? raw.tmdbId : raw.id;
    if (typeof id !== 'number' || id <= 0) return null;

    let mediaType: SeerrMediaType | undefined;
    if (raw.mediaType === 'movie' || raw.mediaType === 'tv') {
        mediaType = raw.mediaType;
    } else if (mediaTypeHint) {
        mediaType = mediaTypeHint;
    }
    if (!mediaType) return null;

    const title =
        (mediaType === 'movie' ? raw.title || raw.name : raw.name || raw.title) || '';
    if (!title) return null;

    return {
        id,
        mediaType,
        title,
        posterPath: raw.posterPath || raw.image,
        releaseDate:
            mediaType === 'movie'
                ? raw.releaseDate || raw.firstAirDate
                : raw.firstAirDate || raw.releaseDate,
        mediaInfo: raw.mediaInfo,
    };
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

export async function getSeerrDiscoverSliders(): Promise<SeerrResolvedSlider[]> {
    const sliders = await fetchSeerrCatalog<SeerrDiscoverSlider[]>('settings/discover');
    if (!Array.isArray(sliders)) return [];
    return sliders
        .filter((slider) => slider.enabled)
        .sort((a, b) => a.order - b.order)
        .map(resolveDiscoverSlider)
        .filter((slider): slider is SeerrResolvedSlider => slider !== null);
}

export async function getSeerrSliderItems(
    slider: SeerrResolvedSlider
): Promise<SeerrSearchResultItem[]> {
    const data = await fetchSeerrCatalog<{ results?: CatalogRawItem[] }>(
        slider.path,
        slider.query
    );
    return (data.results ?? [])
        .map((item) => mapCatalogItem(item, slider.mediaTypeHint))
        .filter((item): item is SeerrSearchResultItem => item !== null);
}
