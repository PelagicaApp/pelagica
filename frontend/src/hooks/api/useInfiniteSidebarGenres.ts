import { getApi } from '@/api/getApi';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import type { LibraryItemsResponse } from '@/hooks/api/useLibraryItems';
import { getRetryConfig } from '@/utils/authErrorHandler';
import { SIDEBAR_LIBRARY_PAGE_SIZE } from '@/hooks/api/useInfiniteLibraryItems';
import { enrichGenresWithItemCounts } from '@/utils/enrichGenresWithItemCounts';

type UseInfiniteSidebarGenresOptions = {
    parentId?: string | null;
    includeItemTypes: BaseItemKind[];
    searchTerm?: string;
    enabled?: boolean;
};

export function useInfiniteSidebarGenres({
    parentId,
    includeItemTypes,
    searchTerm,
    enabled = true,
}: UseInfiniteSidebarGenresOptions) {
    return useInfiniteQuery({
        queryKey: ['sidebarGenres', 'infinite', parentId, includeItemTypes, searchTerm],
        initialPageParam: 0,
        queryFn: async ({ pageParam }): Promise<LibraryItemsResponse> => {
            const api = getApi();
            const genresApi = getGenresApi(api);
            const term = searchTerm?.trim();
            const response = await genresApi.getGenres({
                ...(parentId ? { parentId } : {}),
                includeItemTypes,
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                limit: SIDEBAR_LIBRARY_PAGE_SIZE,
                startIndex: pageParam,
                ...(term ? { searchTerm: term } : {}),
            });

            const genres = response.data.Items || [];
            const items = await enrichGenresWithItemCounts(genres, includeItemTypes, parentId);

            return {
                items,
                totalCount: response.data.TotalRecordCount || 0,
            };
        },
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((sum, page) => sum + page.items.length, 0);
            if (loadedCount >= lastPage.totalCount) return undefined;
            return loadedCount;
        },
        enabled: enabled && includeItemTypes.length > 0,
        ...getRetryConfig(),
    });
}
