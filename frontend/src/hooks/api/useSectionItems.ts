import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { SectionItemsConfig } from './useConfig';
import { ItemFilter, type BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';
import type { ItemsQueryParams, ItemsQueryResult } from '@/hooks/useItemsGridState';

export function useSectionItems(
    config: SectionItemsConfig | undefined,
    params: ItemsQueryParams
): ItemsQueryResult {
    const sectionTypes = config?.types?.length
        ? config.types
        : (['Movie', 'Series'] as BaseItemKind[]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['sectionItems', config, params],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);

            const filters: ItemFilter[] = [];
            if (config?.isInKefinTweaksWatchlist) filters.push(ItemFilter.Likes);
            if (config?.isUnplayed) filters.push(ItemFilter.IsUnplayed);

            const response = await itemsApi.getItems({
                parentId: config?.libraryId,
                sortBy: params.sortBy,
                sortOrder: params.sortOrder,
                limit: params.limit,
                startIndex: params.startIndex,
                recursive: true,
                includeItemTypes: sectionTypes,
                genres: config?.genres,
                tags: config?.tags,
                isFavorite: config?.isFavorite ?? undefined,
                enableUserData: true,
                filters,
                locationTypes: ['FileSystem'],
            });

            return {
                items: response.data.Items ?? [],
                totalCount: response.data.TotalRecordCount ?? 0,
            };
        },
        enabled: !!config,
        ...getRetryConfig(),
    });

    return { data, isLoading, error };
}
