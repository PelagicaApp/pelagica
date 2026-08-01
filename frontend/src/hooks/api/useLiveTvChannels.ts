import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';
import { getUserId } from '@/utils/localstorageCredentials';

export type UseLiveTvChannelsOptions = {
    limit?: number;
    startIndex?: number;
    isFavorite?: boolean;
    isMovie?: boolean;
    isSeries?: boolean;
    isNews?: boolean;
    isKids?: boolean;
    isSports?: boolean;
};

export interface LiveTvChannelsResponse {
    items: Array<BaseItemDto>;
    totalCount: number;
}

export function useLiveTvChannels(
    options?: UseLiveTvChannelsOptions
): ReturnType<typeof useQuery<LiveTvChannelsResponse>> {
    return useQuery<LiveTvChannelsResponse>({
        queryKey: [
            'liveTvChannels',
            options?.startIndex,
            options?.limit,
            options?.isFavorite,
            options?.isMovie,
            options?.isSeries,
            options?.isNews,
            options?.isKids,
            options?.isSports,
        ],
        queryFn: async (): Promise<LiveTvChannelsResponse> => {
            const api = getApi();
            const liveTvApi = getLiveTvApi(api);
            const response = await liveTvApi.getLiveTvChannels({
                userId: getUserId() || undefined,
                startIndex: options?.startIndex ?? 0,
                limit: options?.limit ?? 100,
                isFavorite: options?.isFavorite,
                isMovie: options?.isMovie,
                isSeries: options?.isSeries,
                isNews: options?.isNews,
                isKids: options?.isKids,
                isSports: options?.isSports,
                enableImages: true,
                enableUserData: true,
                addCurrentProgram: true,
                sortBy: ['Name'],
            });
            return {
                items: response.data.Items || [],
                totalCount: response.data.TotalRecordCount || 0,
            };
        },
        ...getRetryConfig(),
    });
}
