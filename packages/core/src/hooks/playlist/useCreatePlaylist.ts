import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';
import type { MediaType } from '@jellyfin/sdk/lib/generated-client/models';
import { getApi } from '../../api/getApi';

interface CreatePlaylistInput {
    name: string;
    userId?: string;
    mediaType?: MediaType;
}

export function useCreatePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, userId, mediaType }: CreatePlaylistInput) => {
            const api = getApi();
            const playlistsApi = getPlaylistApi(api);

            const response = await playlistsApi.createPlaylist({
                createPlaylistDto: {
                    Name: name,
                    UserId: userId,
                    MediaType: mediaType,
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
