import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

export function usePlaylists(userId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['playlists', userId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getLibraryApi(api);
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
