import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

export function useResumeItems(userId: string | null | undefined, limit: number = 20) {
    return useQuery({
        queryKey: ['resume', userId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);

            const res = await itemsApi.getResumeItems({
                userId: userId!,
                limit,
                fields: ['PrimaryImageAspectRatio'],
                enableUserData: true,
                enableImages: true,
            });

            return res.data.Items || [];
        },
        enabled: !!userId,
        ...getRetryConfig(),
    });
}
