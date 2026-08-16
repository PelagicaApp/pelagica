import { getApi } from '../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

export interface EditItemMetadataInput {
    itemId: string;
    baseItemDto: BaseItemDto;
}

export function useEditItemMetadata(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    const { mutate: editItemMetadata, isPending: isSaving } = useMutation({
        mutationFn: async ({ itemId, baseItemDto }: EditItemMetadataInput) => {
            if (!itemId) throw new Error('Item ID is required');

            const api = getApi();
            const itemUpdateApi = getItemUpdateApi(api);

            await itemUpdateApi.updateItem({
                itemId,
                baseItemDto,
            });

            return itemId;
        },
        onSuccess: (itemId) => {
            queryClient.invalidateQueries({ queryKey: ['item', itemId] });
            queryClient.invalidateQueries({ queryKey: ['playerItem', itemId] });
            queryClient.invalidateQueries({ queryKey: ['items'] });
            queryClient.invalidateQueries({ queryKey: ['libraryItems'] });
            queryClient.invalidateQueries({ queryKey: ['mediaBarItems'] });
            onSuccess?.();
        },
    });

    return {
        editItemMetadata,
        isSaving,
    };
}
