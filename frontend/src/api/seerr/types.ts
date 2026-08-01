export const SeerrMediaStatus = {
    UNKNOWN: 1,
    PENDING: 2,
    PROCESSING: 3,
    PARTIALLY_AVAILABLE: 4,
    AVAILABLE: 5,
} as const;

export type SeerrMediaStatus = (typeof SeerrMediaStatus)[keyof typeof SeerrMediaStatus];

export interface SeerrMediaInfoSeason {
    seasonNumber: number;
    status: SeerrMediaStatus;
}

export const SeerrRequestStatus = {
    PENDING: 1,
    APPROVED: 2,
    DECLINED: 3,
} as const;

export type SeerrRequestStatus = (typeof SeerrRequestStatus)[keyof typeof SeerrRequestStatus];

export interface SeerrMediaRequestSeason {
    seasonNumber: number;
}

export interface SeerrMediaRequest {
    id: number;
    status: SeerrRequestStatus;
    seasons?: SeerrMediaRequestSeason[];
}

export interface SeerrMediaInfo {
    status: SeerrMediaStatus;
    jellyfinMediaId?: string;
    seasons?: SeerrMediaInfoSeason[];
    requests?: SeerrMediaRequest[];
}

export interface SeerrSeason {
    seasonNumber: number;
    name?: string;
    episodeCount?: number;
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
    backdropPath?: string;
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
    backdropPath?: string;
    firstAirDate?: string;
    mediaInfo?: SeerrMediaInfo;
    genres?: SeerrGenre[];
    relatedVideos?: SeerrRelatedVideo[];
    seasons?: SeerrSeason[];
}

export interface SeerrItemDetails {
    id: number;
    mediaType: SeerrMediaType;
    title: string;
    overview?: string;
    posterPath?: string;
    backdropPath?: string;
    releaseDate?: string;
    mediaInfo?: SeerrMediaInfo;
    genres?: SeerrGenre[];
    relatedVideos?: SeerrRelatedVideo[];
    seasons?: SeerrSeason[];
}

export interface SeerrRequestPayload {
    mediaType: SeerrMediaType;
    mediaId: number;
    seasons?: number[] | 'all';
}
