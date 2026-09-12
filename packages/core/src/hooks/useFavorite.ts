import { getApi } from '../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { useUserLibraryItem } from './useUserLibraryItem';

export function useFavorite(itemId: string | null | undefined) {
    const queryClient = useQueryClient();

    const { data: item, isLoading: isFavoriteLoading } = useUserLibraryItem(itemId);

    const isFavorite = item?.UserData?.IsFavorite ?? false;

    const { mutate: toggleFavorite, isPending: isToggling } = useMutation({
        mutationFn: async (favorite: boolean) => {
            if (!itemId) throw new Error('Item ID is required');
            const api = getApi();
            const userDataApi = getUserDataApi(api);
            if (favorite) {
                await userDataApi.markFavoriteItem({ itemId });
            } else {
                await userDataApi.unmarkFavoriteItem({ itemId });
            }
            return favorite;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userLibraryItem', itemId] });
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
