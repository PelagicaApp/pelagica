import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { SectionItemsConfig } from './useConfig';
import { ItemFilter, type BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useRowItems(items?: SectionItemsConfig) {
    const sectionTypes = items?.types?.length
        ? items.types
        : (['Movie', 'Series'] as BaseItemKind[]);

    return useQuery({
        queryKey: ['mediaBarItems', items],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);

            const filters: ItemFilter[] = [];
            if (items?.isInKefinTweaksWatchlist) filters.push(ItemFilter.Likes);
            if (items?.isUnplayed) filters.push(ItemFilter.IsUnplayed);

            const response = await itemsApi.getItems({
                parentId: items?.libraryId,
                sortBy: items?.sortBy || ['Random'],
                sortOrder: items?.sortOrder ? [items.sortOrder] : ['Descending'],
                limit: items?.limit || 10,
                recursive: true,
                includeItemTypes: sectionTypes,
                fields: ['LocalTrailerCount'],
                genres: items?.genres,
                tags: items?.tags,
                isFavorite: items?.isFavorite ?? undefined,
                enableUserData: true,
                filters,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items;
        },
        ...getRetryConfig(),
    });
}
