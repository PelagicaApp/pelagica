import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getApi } from '../../api/getApi';

interface MovePlaylistItemInput {
    playlistId: string;
    playlistItemId: string;
    fromIndex: number;
    newIndex: number;
}

function moveEntry<T>(list: T[], from: number, to: number): T[] {
    if (from < 0 || from >= list.length || to < 0 || to >= list.length) return list;
    const next = list.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
}

export function useMovePlaylistItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId, playlistItemId, newIndex }: MovePlaylistItemInput) => {
            const playlistsApi = getPlaylistApi(getApi());
            await playlistsApi.moveItem({ playlistId, itemId: playlistItemId, newIndex });
        },
        onMutate: async ({ playlistId, fromIndex, newIndex }) => {
            const queryKey = ['playlistItems', playlistId];
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueriesData<BaseItemDto[]>({ queryKey });
            queryClient.setQueriesData<BaseItemDto[]>({ queryKey }, (old) =>
                old ? moveEntry(old, fromIndex, newIndex) : old
            );
            return { previous };
        },
        onError: (_error, _input, context) => {
            context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
        onSettled: (_data, _error, { playlistId }) => {
            queryClient.invalidateQueries({ queryKey: ['playlistItems', playlistId] });
        },
    });
}
