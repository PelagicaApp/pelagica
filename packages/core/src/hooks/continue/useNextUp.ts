import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

export function useNextUp(userId: string | null | undefined, limit: number = 20) {
    return useQuery({
        queryKey: ['nextUp', userId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const tvShowsApi = getTvShowsApi(api);

            const res = await tvShowsApi.getNextUp({
                userId: userId!,
                limit,
                fields: ['PrimaryImageAspectRatio'],
                enableUserData: true,
                enableImages: true,
                enableResumable: false,
            });

            return res.data.Items || [];
        },
        enabled: !!userId,
        ...getRetryConfig(),
    });
}
