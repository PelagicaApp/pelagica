import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useSimilarItems(itemId: string | null | undefined, limit: number = 12) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['similarItems', itemId, limit],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const libraryApi = getLibraryApi(api);
            const response = await libraryApi.getSimilarItems({
                itemId: itemId!,
                limit,
                fields: ['Overview', 'PrimaryImageAspectRatio'],
            });
            return response.data.Items || [];
        },
        enabled: !!itemId,
        ...getRetryConfig(),
    });
}
