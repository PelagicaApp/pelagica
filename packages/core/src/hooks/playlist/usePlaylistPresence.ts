import { useQuery } from '@tanstack/react-query';
import { getApi } from '../../api/getApi';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { getRetryConfig } from '../../utils/authErrorHandler';

export type PlaylistPresence = Record<
    string,
    {
        present: boolean;
        playlistItemId: string | null;
    }
>;

export function usePlaylistPresence(
    itemId: string | undefined,
    playlistIds: string[] | undefined,
    userId: string | undefined
) {
    return useQuery<PlaylistPresence>({
        queryKey: ['playlistPresence', itemId, playlistIds, userId],
        enabled: !!itemId && !!userId && !!playlistIds?.length,
        queryFn: async () => {
            const api = getApi();
            const playlistsApi = getPlaylistsApi(api);

            const results = await Promise.all(
                (playlistIds || []).map(async (playlistId) => {
                    const response = await playlistsApi.getPlaylistItems({
                        playlistId,
                        userId: userId!,
                    });
                    const items = response.data.Items || [];
                    const found = items.find((item) => item.Id === itemId);
                    return {
                        playlistId,
                        present: !!found,
                        playlistItemId: found?.PlaylistItemId ?? null,
                    };
                })
            );

            const presence: PlaylistPresence = {};
            results.forEach(({ playlistId, present, playlistItemId }) => {
                presence[playlistId] = { present, playlistItemId };
            });

            return presence;
        },
        ...getRetryConfig(),
    });
}
