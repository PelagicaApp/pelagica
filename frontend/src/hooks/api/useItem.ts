import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useItem(
    itemId: string | null | undefined,
    enableUserData?: boolean | undefined,
    userId?: string | undefined
) {
    return useQuery<BaseItemDto>({
        queryKey: ['item', itemId],
        queryFn: async (): Promise<BaseItemDto> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                ids: [itemId!],
                fields: [
                    'Overview',
                    'Genres',
                    'People',
                    'Studios',
                    'ChildCount',
                    'RecursiveItemCount',
                    'ParentId',
                    'MediaStreams',
                    'ProductionLocations',
                    'RemoteTrailers',
                    'MediaSources',
                    'Path',
                ],
                enableUserData,
                userId,
            });
            const item = response.data.Items?.[0];
            if (!item) {
                throw new Error(`Item not found: ${itemId}`);
            }
            return item;
        },
        enabled: !!itemId,
        ...getRetryConfig(),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
