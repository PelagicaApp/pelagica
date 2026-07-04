import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function usePlaylistItems(
    playlistId: string | null | undefined,
    userId: string | null | undefined
) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['playlistItems', playlistId, userId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const playlistsApi = getPlaylistsApi(api);
            const response = await playlistsApi.getPlaylistItems({
                playlistId: playlistId!,
                userId: userId!,
                fields: ['MediaSources', 'MediaStreams'],
                enableUserData: true,
            });
            return response.data.Items || [];
        },
        enabled: !!playlistId && !!userId,
        ...getRetryConfig(),
    });
}
