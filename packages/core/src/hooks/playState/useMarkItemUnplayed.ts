import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getApi } from '../../api/getApi';
import { invalidateItemCache } from '../../api/getItemCached';

interface MarkUnplayedInput {
    itemId: string;
    userId?: string;
}

export function useMarkItemUnplayed() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ itemId, userId }: MarkUnplayedInput) => {
            if (!userId) throw new Error('User ID is required');

            const api = getApi();
            const playstateApi = getPlaystateApi(api);

            await playstateApi.markUnplayedItem({
                userId,
                itemId,
            });
        },
        onSuccess: (_, { itemId, userId }) => {
            invalidateItemCache(itemId);
            queryClient.invalidateQueries({
                queryKey: ['itemPlayState', userId, itemId],
            });
            queryClient.invalidateQueries({
                queryKey: ['item', itemId],
            });
            queryClient.invalidateQueries({
                queryKey: ['episodes', itemId],
            });
        },
    });
}
