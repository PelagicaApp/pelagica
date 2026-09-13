import { getApi } from '../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { useUserLibraryItem } from './useUserLibraryItem';

export function useLike(itemId: string | null | undefined) {
    const queryClient = useQueryClient();

    const { data: item, isLoading: isLikedLoading } = useUserLibraryItem(itemId);

    const isLiked = item?.UserData?.Likes ?? false;

    const { mutate: toggleLike, isPending: isUpdating } = useMutation({
        mutationFn: async (like: boolean) => {
            if (!itemId) throw new Error('Item ID is required');
            const api = getApi();
            const userDataApi = getUserDataApi(api);
            await userDataApi.updateUserItemRating({ itemId, likes: like });
            return like;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userLibraryItem', itemId] });
            queryClient.invalidateQueries({ queryKey: ['item', itemId] });
        },
    });

    return {
        isLiked,
        toggleLike,
        isLoading: isLikedLoading || isUpdating,
    };
}
