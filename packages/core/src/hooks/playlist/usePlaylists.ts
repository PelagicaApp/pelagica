import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

export function usePlaylists(userId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['playlists', userId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: userId!,
                includeItemTypes: ['Playlist'],
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                recursive: true,
            });
            return response.data.Items || [];
        },
        enabled: !!userId,
        ...getRetryConfig(),
    });
}
