import { getApi } from '@/api/getApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useFavorite(itemId: string | null | undefined) {
    const queryClient = useQueryClient();

    const { data: isFavorite = false, isLoading: isFavoriteLoading } = useQuery({
        queryKey: ['favorite', itemId],
        queryFn: async (): Promise<boolean> => {
            if (!itemId) return false;
            const api = getApi();
            const userLibraryApi = getUserLibraryApi(api);
            const response = await userLibraryApi.getItem({ itemId });
            return response.data.UserData?.IsFavorite ?? false;
        },
        enabled: !!itemId,
        ...getRetryConfig(),
    });

    const { mutate: toggleFavorite, isPending: isToggling } = useMutation({
        mutationFn: async (favorite: boolean) => {
            if (!itemId) throw new Error('Item ID is required');
            const api = getApi();
            const userLibraryApi = getUserLibraryApi(api);

            if (favorite) {
                await userLibraryApi.markFavoriteItem({ itemId });
            } else {
                await userLibraryApi.unmarkFavoriteItem({ itemId });
            }
            return favorite;
        },
        onSuccess: (newFavoriteState) => {
            queryClient.setQueryData(['favorite', itemId], newFavoriteState);
            queryClient.invalidateQueries({ queryKey: ['item', itemId] });
            queryClient.invalidateQueries({ queryKey: ['favoriteAlbums'] });
            queryClient.invalidateQueries({ queryKey: ['favoriteArtists'] });
            queryClient.invalidateQueries({ queryKey: ['favoriteSongs'] });
        },
    });

    return {
        isFavorite,
        toggleFavorite,
        isLoading: isFavoriteLoading || isToggling,
    };
}
