import { getApi } from '@/api/getApi';
import type {
    BaseItemKind,
    BaseItemDto,
    ItemSortBy,
    SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useSidebarBrowser } from '@/context/SidebarBrowserContext';
import {
    GENRE_MEDIA_PARAM,
    getGenreDetailIncludeTypes,
    parseGenreMediaCategory,
} from '@/utils/sidebarBrowseFilters';
import type { ItemsQueryParams, ItemsQueryResult } from '@/pages/Item/ItemsListPage';

interface GenreItemsOptions {
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder[];
    limit?: number;
    startIndex?: number;
    includeItemTypes?: BaseItemKind[];
    parentId?: string;
}

interface GenreItemsResponse {
    items: BaseItemDto[];
    totalCount: number;
}

const DEFAULT_GENRE_ITEM_TYPES: BaseItemKind[] = ['Movie', 'Series'];

export function useGenreItems(genreId: string, options?: GenreItemsOptions) {
    const includeItemTypes = options?.includeItemTypes ?? DEFAULT_GENRE_ITEM_TYPES;

    return useQuery<GenreItemsResponse>({
        queryKey: ['genre-items', genreId, options, includeItemTypes, options?.parentId],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);

            const itemsResponse = await itemsApi.getItems({
                genreIds: [genreId],
                includeItemTypes,
                recursive: true,
                excludeItemTypes: ['CollectionFolder'],
                sortBy: options?.sortBy ?? ['Random'],
                sortOrder: options?.sortOrder ?? ['Descending'],
                limit: options?.limit ?? 50,
                startIndex: options?.startIndex ?? 0,
                ...(options?.parentId ? { parentId: options.parentId } : {}),
            });

            return {
                items: (itemsResponse.data?.Items ?? []) as BaseItemDto[],
                totalCount: itemsResponse.data?.TotalRecordCount ?? 0,
            };
        },
        enabled: !!genreId,
    });
}

/** Used by ItemsListPage on genre pages; reads ?media= and ?library= from the URL. */
export function useGenreItemsScoped(genreId: string, params: ItemsQueryParams): ItemsQueryResult {
    const [searchParams] = useSearchParams();
    const { category: sidebarCategory } = useSidebarBrowser();
    const mediaFromUrl = parseGenreMediaCategory(searchParams.get(GENRE_MEDIA_PARAM));
    const mediaFromSidebar =
        sidebarCategory === 'music' || sidebarCategory === 'series' || sidebarCategory === 'movie'
            ? sidebarCategory
            : null;
    const mediaCategory = mediaFromUrl ?? mediaFromSidebar;
    const includeItemTypes = mediaCategory
        ? getGenreDetailIncludeTypes(mediaCategory)
        : DEFAULT_GENRE_ITEM_TYPES;
    const libraryId = searchParams.get('library') ?? undefined;

    const query = useGenreItems(genreId, {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        limit: params.limit,
        startIndex: params.startIndex,
        includeItemTypes,
        parentId: libraryId,
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
}
