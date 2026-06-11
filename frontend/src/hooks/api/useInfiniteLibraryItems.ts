import { getApi } from '@/api/getApi';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { UseLibraryItemsOptions, LibraryItemsResponse } from '@/hooks/api/useLibraryItems';
import { getRetryConfig } from '@/utils/authErrorHandler';

export const SIDEBAR_LIBRARY_PAGE_SIZE = 50;

export function useInfiniteLibraryItems(
    libraryId?: string | null,
    options?: Omit<UseLibraryItemsOptions, 'startIndex' | 'limit'>
) {
    return useInfiniteQuery({
        queryKey: [
            'libraryItems',
            'infinite',
            libraryId,
            options?.sortBy,
            options?.sortOrder,
            options?.searchTerm,
            options?.includeItemTypes,
            options?.genreIds,
            options?.userId,
        ],
        initialPageParam: 0,
        queryFn: async ({ pageParam }): Promise<LibraryItemsResponse> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const searchTerm = options?.searchTerm?.trim();
            const isPlaylistQuery = options?.includeItemTypes?.includes('Playlist');

            const response = await itemsApi.getItems({
                ...(isPlaylistQuery
                    ? { userId: options?.userId ?? libraryId! }
                    : { parentId: libraryId! }),
                sortBy: options?.sortBy || ['SortName'],
                sortOrder: options?.sortOrder ? [options.sortOrder] : ['Ascending'],
                limit: SIDEBAR_LIBRARY_PAGE_SIZE,
                startIndex: pageParam,
                recursive: options?.recursive ?? true,
                includeItemTypes: options?.includeItemTypes,
                locationTypes: ['FileSystem'],
                ...(searchTerm ? { searchTerm } : {}),
                ...(options?.genreIds?.length ? { genreIds: options.genreIds } : {}),
            });
            return {
                items: response.data.Items || [],
                totalCount: response.data.TotalRecordCount || 0,
            };
        },
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((sum, page) => sum + page.items.length, 0);
            if (loadedCount >= lastPage.totalCount) return undefined;
            return loadedCount;
        },
        enabled: options?.includeItemTypes?.includes('Playlist') ? !!options?.userId : !!libraryId,
        ...getRetryConfig(),
    });
}
