import { getApi } from '../../api/getApi';
import type { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery } from '@tanstack/react-query';

interface GenreItemsOptions {
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder[];
    limit?: number;
    startIndex?: number;
}

interface GenreItemsResponse {
    items: BaseItemDto[];
    totalCount: number;
}

export function useGenreItems(genreId: string, options?: GenreItemsOptions) {
    return useQuery<GenreItemsResponse>({
        queryKey: ['genre-items', genreId, options],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);

            const itemsResponse = await itemsApi.getItems({
                genreIds: [genreId],
                includeItemTypes: ['Movie', 'Series'],
                recursive: true,
                excludeItemTypes: ['CollectionFolder'],
                sortBy: options?.sortBy ?? ['Random'],
                sortOrder: options?.sortOrder ?? ['Descending'],
                limit: options?.limit ?? 50,
                startIndex: options?.startIndex ?? 0,
            });

            return {
                items: (itemsResponse.data?.Items ?? []) as BaseItemDto[],
                totalCount: itemsResponse.data?.TotalRecordCount ?? 0,
            };
        },
        enabled: !!genreId,
    });
}
