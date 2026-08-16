import { useQuery } from '@tanstack/react-query';
import { getRetryConfig } from '../utils/authErrorHandler';
import { getAccessToken, getServerUrl } from '../utils/localstorageCredentials';
import { useConfig } from './useConfig';

export interface RecommendationResponse {
    server: ServerInfo;
    user: UserInfo;
    params: RecommendationParams;
    data: RecommendationEntry[];
}

export interface ServerInfo {
    id: number;
    name: string;
}

export interface UserInfo {
    id: string;
    name: string;
}

export interface RecommendationParams {
    serverId: number;
    serverName: string;
    limit: number;
    type: string;
    range: string;
    start: string | null;
    end: string | null;
    includeBasedOn: boolean;
    includeReasons: boolean;
    targetUserId: string | null;
    format: string;
}

export interface RecommendationEntry {
    item: MediaItem;
    similarity: number;
    basedOn: MediaItem[];
    reason: string;
}

export interface MediaItem {
    id: string;
    name: string;
    type: 'Movie' | 'Series' | string;
    productionYear: number;
    runtimeTicks: number;
    genres: string[];
    communityRating: number;
    primaryImageTag: string | null;
    primaryImageThumbTag: string | null;
    primaryImageLogoTag: string | null;
    backdropImageTags: string[] | null;

    seriesId: string | null;
    seriesPrimaryImageTag: string | null;

    parentBackdropItemId: string | null;
    parentBackdropImageTags: string[] | null;

    parentThumbItemId: string | null;
    parentThumbImageTag: string | null;
}

export type RecommendationTypeFilter = 'all' | 'Movie' | 'Series';

export function useRecommendedItems(options: { type?: RecommendationTypeFilter; limit?: number }) {
    const { config } = useConfig();
    const streamystatsUrl = config.streamystatsUrl;

    return useQuery<RecommendationResponse | null>({
        queryKey: ['useRecommendedItems', options.type, options.limit],
        queryFn: async () => {
            if (!streamystatsUrl) return null;

            const jellyServerHostname = new URL(getServerUrl() || '').hostname;
            const jellyToken = getAccessToken();
            if (!jellyServerHostname || !jellyToken) return null;

            const url = new URL(streamystatsUrl);
            url.pathname = '/api/recommendations';
            url.searchParams.append('serverUrl', jellyServerHostname);
            url.searchParams.append('format', 'full');
            if (options.type) url.searchParams.append('type', options.type);
            if (options.limit !== undefined)
                url.searchParams.append('limit', options.limit.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `MediaBrowser Token="${jellyToken}"`,
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        },
        enabled: !!streamystatsUrl,
        ...getRetryConfig(),
    });
}
