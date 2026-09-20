import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import type {
    BaseItemDto,
    BaseItemKind,
    LocationType,
    ItemSortBy,
    SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';
import { getUserId } from '../utils/localstorageCredentials';
import type { LibraryCollectionType } from '../types/items';

export type UseLibraryItemsOptions = {
    limit?: number;
    startIndex?: number;
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder;
    includeItemTypes?: BaseItemKind[];
    recursive?: boolean;
    locationTypes?: LocationType[];
    collectionType?: LibraryCollectionType | null;
};

export interface LibraryItemsResponse {
    items: Array<BaseItemDto>;
    totalCount: number;
}

export function useLibraryItems(
    libraryId?: string | null,
    options?: UseLibraryItemsOptions
): ReturnType<typeof useQuery<LibraryItemsResponse>> {
    return useQuery<LibraryItemsResponse>({
        queryKey: [
            'libraryItems',
            libraryId,
            options?.startIndex,
            options?.limit,
            options?.sortBy,
            options?.sortOrder,
            options?.includeItemTypes,
            options?.recursive,
            options?.locationTypes,
            options?.collectionType,
        ],
        queryFn: async (): Promise<LibraryItemsResponse> => {
            const api = getApi();
            if (options?.collectionType === 'livetv') {
                const response = await getLiveTvApi(api).getLiveTvChannels({
                    userId: getUserId() || undefined,
                    limit: options.limit ?? 50,
                    startIndex: options.startIndex ?? 0,
                    sortBy: options.sortBy || ['SortName'],
                    sortOrder: options.sortOrder ?? 'Ascending',
                    enableImages: true,
                    enableUserData: true,
                    addCurrentProgram: true,
                });
                return {
                    items: response.data.Items || [],
                    totalCount: response.data.TotalRecordCount || 0,
                };
            }
            const itemsApi = getLibraryApi(api);
            const response = await itemsApi.getItems({
                parentId: libraryId!,
                sortBy: options?.sortBy || ['SortName'],
                sortOrder: options?.sortOrder ? [options.sortOrder] : ['Ascending'],
                limit: options?.limit ?? 50,
                startIndex: options?.startIndex ?? 0,
                recursive: options?.recursive ?? true,
                includeItemTypes: options?.includeItemTypes,
                locationTypes: options?.locationTypes ?? ['FileSystem'],
                fields: ['PrimaryImageAspectRatio'],
                userId: getUserId() || undefined,
            });
            return {
                items: response.data.Items || [],
                totalCount: response.data.TotalRecordCount || 0,
            };
        },
        enabled: !!libraryId,
        ...getRetryConfig(),
    });
}
