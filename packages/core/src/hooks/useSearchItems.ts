import { useQuery } from '@tanstack/react-query';
import { getApi } from '../api/getApi';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

interface UseSearchItemsOptions {
    itemTypes?: BaseItemKind[];
    limit?: number;
    userId?: string;
}

export function useSearchItems(searchTerm: string, options?: UseSearchItemsOptions) {
    const normalizedItemTypes =
        options?.itemTypes && options.itemTypes.length ? [...options.itemTypes] : undefined;

    const itemTypesKey = normalizedItemTypes ? [...normalizedItemTypes].sort() : 'all';
    const limit = options?.limit ?? 15;

    return useQuery<BaseItemDto[]>({
        queryKey: ['searchItems', searchTerm, itemTypesKey, limit, options?.userId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            try {
                const api = getApi();
                const itemsApi = getItemsApi(api);

                const response = await itemsApi.getItems({
                    userId: options?.userId,
                    enableUserData: true,
                    searchTerm: searchTerm.trim(),
                    includeItemTypes: normalizedItemTypes,
                    limit,
                    recursive: true,
                    fields: ['Overview', 'ParentId'],
                    locationTypes: ['FileSystem'],
                });

                return response.data.Items ?? [];
            } catch (err) {
                console.error('Search error:', err);
                throw err;
            }
        },
        enabled: searchTerm.trim().length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        ...getRetryConfig(),
    });
}
