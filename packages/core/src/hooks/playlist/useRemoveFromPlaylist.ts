import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { getApi } from '../../api/getApi';

interface RemoveFromPlaylistInput {
    playlistId: string;
    entryIds: string[];
}

export function useRemoveFromPlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId, entryIds }: RemoveFromPlaylistInput) => {
            const api = getApi();
            const playlistsApi = getPlaylistsApi(api);

            await playlistsApi.removeItemFromPlaylist({
                playlistId,
                entryIds,
            });
        },
        onSuccess: (_, { playlistId }) => {
            queryClient.invalidateQueries({
                queryKey: ['playlistItems', playlistId],
            });
        },
    });
}
