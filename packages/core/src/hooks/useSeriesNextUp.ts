import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useSeriesNextUp(
    seriesId: string | null | undefined,
    userId: string | null | undefined
) {
    return useQuery<BaseItemDto | null>({
        queryKey: ['seriesNextUp', seriesId, userId],
        queryFn: async (): Promise<BaseItemDto | null> => {
            const api = getApi();
            const tvShowsApi = getShowApi(api);
            const response = await tvShowsApi.getNextUp({
                userId: userId!,
                seriesId: seriesId!,
                limit: 1,
                enableUserData: true,
            });
            return response.data.Items?.[0] ?? null;
        },
        enabled: !!seriesId && !!userId,
        ...getRetryConfig(),
    });
}
