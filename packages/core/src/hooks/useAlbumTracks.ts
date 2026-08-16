import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useAlbumTracks(albumId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['albumTracks', albumId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                parentId: albumId!,
                includeItemTypes: ['Audio'],
                sortBy: ['IndexNumber'],
                sortOrder: ['Ascending'],
                fields: ['Overview', 'MediaSources', 'MediaStreams'],
                enableUserData: true,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        enabled: !!albumId,
        ...getRetryConfig(),
    });
}
