import { getApi } from '../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getItemRefreshApi } from '@jellyfin/sdk/lib/utils/api/item-refresh-api';
import type { MetadataRefreshMode } from '@jellyfin/sdk/lib/generated-client/models';

export interface RefreshItemMetadataInput {
    itemId: string;
    metadataRefreshMode?: MetadataRefreshMode;
    imageRefreshMode?: MetadataRefreshMode;
    replaceAllMetadata?: boolean;
    replaceAllImages?: boolean;
    regenerateTrickplay?: boolean;
}

export function useRefreshItemMetadata(onSuccess?: () => void) {
    const queryClient = useQueryClient();

    const { mutate: refreshItemMetadata, isPending: isRefreshing } = useMutation({
        mutationFn: async ({
            itemId,
            metadataRefreshMode,
            imageRefreshMode,
            replaceAllMetadata,
            replaceAllImages,
            regenerateTrickplay,
        }: RefreshItemMetadataInput) => {
            if (!itemId) throw new Error('Item ID is required');

            const api = getApi();
            const itemRefreshApi = getItemRefreshApi(api);

            await itemRefreshApi.refreshItem({
                itemId,
                metadataRefreshMode,
                imageRefreshMode,
                replaceAllMetadata,
                replaceAllImages,
                regenerateTrickplay,
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
        refreshItemMetadata,
        isRefreshing,
    };
}
