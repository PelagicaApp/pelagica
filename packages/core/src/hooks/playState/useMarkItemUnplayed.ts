import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { getApi } from '../../api/getApi';
import { invalidatePlayStateQueries } from './invalidatePlayStateQueries';

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
            const playstateApi = getUserDataApi(api);

            await playstateApi.markUnplayedItem({
                userId,
                itemId,
            });
        },
        onSuccess: (_, { itemId, userId }) => {
            invalidatePlayStateQueries(queryClient, itemId, userId);
        },
    });
}
