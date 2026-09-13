import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';
import { getApi } from '../../api/getApi';

interface AddToPlaylistInput {
    playlistId: string;
    itemIds: string[];
    userId?: string;
}

export function useAddToPlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId, itemIds, userId }: AddToPlaylistInput) => {
            const api = getApi();
            const playlistsApi = getPlaylistApi(api);

            await playlistsApi.addItemToPlaylist({
                playlistId,
                ids: itemIds,
                userId,
            });
        },
        onSuccess: (_, { playlistId }) => {
            queryClient.invalidateQueries({
                queryKey: ['playlistItems', playlistId],
            });
        },
    });
}
