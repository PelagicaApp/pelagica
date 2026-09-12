import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { getApi } from '../../api/getApi';

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
            const playstateApi = getUserDataApi(api);

            await playstateApi.markPlayedItem({
                userId,
                itemId,
                datePlayed: datePlayed ?? new Date().toISOString(),
            });
        },
        onSuccess: (_, { itemId, userId }) => {
            queryClient.invalidateQueries({
                queryKey: ['userLibraryItem', itemId, userId],
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
