import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getApi } from '../../api/getApi';
import { invalidateItemCache } from '../../api/getItemCached';

interface MarkPlayedInput {
    itemId: string;
    datePlayed?: string;
    userId?: string;
}

export function useMarkItemPlayed() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ itemId, datePlayed, userId }: MarkPlayedInput) => {
            if (!userId) throw new Error('User ID is required');

            const api = getApi();
            const playstateApi = getPlaystateApi(api);

            await playstateApi.markPlayedItem({
                userId,
                itemId,
                datePlayed: datePlayed ?? new Date().toISOString(),
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
