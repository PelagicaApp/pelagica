import { getApi } from '../api/getApi';
import { invalidateItemCache } from '../api/getItemCached';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

export function useDeleteMedia(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    const { mutate: deleteMedia, isPending: isDeleting } = useMutation({
        mutationFn: async (itemId: string) => {
            if (!itemId) throw new Error('Item ID is required');
            const api = getApi();
            const libraryApi = getLibraryApi(api);
            await libraryApi.deleteItem({ itemId });
            return itemId;
        },
        onSuccess: (deletedItemId) => {
            invalidateItemCache(deletedItemId);
            queryClient.invalidateQueries({ queryKey: ['item', deletedItemId] });
            queryClient.invalidateQueries({ queryKey: ['items'] });
            queryClient.invalidateQueries({ queryKey: ['libraryItems'] });
            queryClient.invalidateQueries({ queryKey: ['mediaBarItems'] });
            onSuccess?.();
        },
    });

    return {
        deleteMedia,
        isDeleting,
    };
}
