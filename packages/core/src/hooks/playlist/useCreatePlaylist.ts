import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { getApi } from '../../api/getApi';

interface CreatePlaylistInput {
    name: string;
    userId?: string;
}

export function useCreatePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, userId }: CreatePlaylistInput) => {
            const api = getApi();
            const playlistsApi = getPlaylistsApi(api);

            const response = await playlistsApi.createPlaylist({
                createPlaylistDto: {
                    Name: name,
                    UserId: userId,
                },
            });

            return response.data;
        },
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({
                queryKey: ['playlists', userId],
            });
        },
    });
}
