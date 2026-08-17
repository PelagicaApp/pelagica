import { getApi } from '../api/getApi';
import { getItemCached, invalidateItemCache } from '../api/getItemCached';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useLike(itemId: string | null | undefined) {
    const queryClient = useQueryClient();

    const { data: isLiked = false, isLoading: isLikedLoading } = useQuery({
        queryKey: ['like', itemId],
        queryFn: async (): Promise<boolean> => {
            if (!itemId) return false;
            const item = await getItemCached(itemId);
            return item.UserData?.Likes ?? false;
        },
        enabled: !!itemId,
        ...getRetryConfig(),
    });

    const { mutate: toggleLike, isPending: isUpdating } = useMutation({
        mutationFn: async (like: boolean) => {
            if (!itemId) throw new Error('Item ID is required');
            const api = getApi();
            const userLibraryApi = getUserLibraryApi(api);
            await userLibraryApi.updateUserItemRating({ itemId, likes: like });
            return like;
        },
        onSuccess: (newLikeState) => {
            if (itemId) {
                invalidateItemCache(itemId);
            }
            queryClient.setQueryData(['like', itemId], newLikeState);
            queryClient.invalidateQueries({ queryKey: ['item', itemId] });
        },
    });

    return {
        isLiked,
        toggleLike,
        isLoading: isLikedLoading || isUpdating,
    };
}
