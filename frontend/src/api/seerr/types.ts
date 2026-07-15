export const SeerrMediaStatus = {
    UNKNOWN: 1,
    PENDING: 2,
    PROCESSING: 3,
    PARTIALLY_AVAILABLE: 4,
    AVAILABLE: 5,
} as const;

export type SeerrMediaStatus = (typeof SeerrMediaStatus)[keyof typeof SeerrMediaStatus];

export interface SeerrMediaInfo {
    status: SeerrMediaStatus;
    jellyfinMediaId?: string;
}

export interface SeerrGenre {
    id: number;
    name: string;
}

export interface SeerrRelatedVideo {
    url: string;
    key: string;
    name: string;
    type: string;
    site: string;
}

export interface SeerrMovieRecommendation {
    id: number;
    title: string;
    posterPath?: string;
    releaseDate?: string;
    mediaInfo?: SeerrMediaInfo;
}

export interface SeerrMovieRecommendationsResponse {
    page: number;
    totalPages: number;
    totalResults: number;
    results: SeerrMovieRecommendation[];
}

export interface SeerrTvRecommendation {
    id: number;
    name: string;
    posterPath?: string;
    firstAirDate?: string;
    mediaInfo?: SeerrMediaInfo;
}

export interface SeerrTvRecommendationsResponse {
    page: number;
    totalPages: number;
    totalResults: number;
    results: SeerrTvRecommendation[];
}

export type SeerrMediaType = 'movie' | 'tv';

export interface SeerrRecommendationItem {
    id: number;
    title: string;
    posterPath?: string;
    releaseDate?: string;
    mediaInfo?: SeerrMediaInfo;
}

export interface SeerrSearchResult {
    id: number;
    mediaType: SeerrMediaType | 'person';
    title?: string;
    name?: string;
    posterPath?: string;
    releaseDate?: string;
    firstAirDate?: string;
    mediaInfo?: SeerrMediaInfo;
}

export interface SeerrSearchResponse {
    page: number;
    totalPages: number;
    totalResults: number;
    results: SeerrSearchResult[];
}

export interface SeerrSearchResultItem extends SeerrRecommendationItem {
    mediaType: SeerrMediaType;
}

export interface SeerrMovieDetailsResponse {
    id: number;
    title: string;
    overview?: string;
    posterPath?: string;
    releaseDate?: string;
    mediaInfo?: SeerrMediaInfo;
    genres?: SeerrGenre[];
    relatedVideos?: SeerrRelatedVideo[];
}

export interface SeerrTvDetailsResponse {
    id: number;
    name: string;
    overview?: string;
    posterPath?: string;
    firstAirDate?: string;
    mediaInfo?: SeerrMediaInfo;
    genres?: SeerrGenre[];
    relatedVideos?: SeerrRelatedVideo[];
}

export interface SeerrItemDetails {
    id: number;
    mediaType: SeerrMediaType;
    title: string;
    overview?: string;
    posterPath?: string;
    releaseDate?: string;
    mediaInfo?: SeerrMediaInfo;
    genres?: SeerrGenre[];
    relatedVideos?: SeerrRelatedVideo[];
}

export interface SeerrRequestPayload {
    mediaType: SeerrMediaType;
    mediaId: number;
    seasons?: number[] | 'all';
}
