import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useSeriesNextUp(
    seriesId: string | null | undefined,
    userId: string | null | undefined
) {
    return useQuery<BaseItemDto | undefined>({
        queryKey: ['seriesNextUp', seriesId, userId],
        queryFn: async (): Promise<BaseItemDto | undefined> => {
            const api = getApi();
            const tvShowsApi = getTvShowsApi(api);
            const response = await tvShowsApi.getNextUp({
                userId: userId!,
                seriesId: seriesId!,
                limit: 1,
                enableUserData: true,
            });
            return response.data.Items?.[0];
        },
        enabled: !!seriesId && !!userId,
        ...getRetryConfig(),
    });
}
