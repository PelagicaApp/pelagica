import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

export function useNextUp(userId: string | null | undefined, limit: number = 20) {
    return useQuery({
        queryKey: ['nextUp', userId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const tvShowsApi = getShowApi(api);

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
