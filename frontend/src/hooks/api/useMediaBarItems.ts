import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { SectionItemsConfig } from './useConfig';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useMediaBarItems(items?: SectionItemsConfig) {
    const sectionTypes = items?.types?.length
        ? items.types
        : (['Movie', 'Series'] as BaseItemKind[]);

    return useQuery({
        queryKey: ['mediaBarItems', items],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                parentId: items?.libraryId,
                sortBy: items?.sortBy || ['Random'],
                sortOrder: items?.sortOrder ? [items.sortOrder] : ['Descending'],
                limit: items?.limit || 10,
                recursive: true,
                includeItemTypes: sectionTypes,
                fields: [
                    'Genres',
                    'Overview',
                    'ChildCount',
                    'RecursiveItemCount',
                    'LocalTrailerCount',
                ],
                genres: items?.genres,
                tags: items?.tags,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...getRetryConfig(),
    });
}
