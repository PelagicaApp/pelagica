import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import type { BaseItemDto, MediaType } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

export function usePlaylists(
    userId: string | null | undefined,
    options?: { mediaTypes?: MediaType[] }
) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['playlists', userId, options?.mediaTypes],
        queryFn: async () => {
            const response = await getLibraryApi(getApi()).getItems({
                userId: userId!,
                includeItemTypes: ['Playlist'],
                mediaTypes: options?.mediaTypes,
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
