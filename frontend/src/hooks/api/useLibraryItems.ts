import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type {
    BaseItemDto,
    BaseItemKind,
    ItemSortBy,
    SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';
import { getUserId } from '../../utils/localstorageCredentials';

export type UseLibraryItemsOptions = {
    limit?: number;
    startIndex?: number;
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder;
    includeItemTypes?: BaseItemKind[];
    recursive?: boolean;
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
        queryKey: ['libraryItems', libraryId, options?.startIndex, options?.limit, options?.sortBy],
        queryFn: async (): Promise<LibraryItemsResponse> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                parentId: libraryId!,
                sortBy: options?.sortBy || ['SortName'],
                sortOrder: options?.sortOrder ? [options.sortOrder] : ['Ascending'],
                limit: options?.limit ?? 50,
                startIndex: options?.startIndex ?? 0,
                recursive: options?.recursive ?? true,
                includeItemTypes: options?.includeItemTypes,
                locationTypes: ['FileSystem'],
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
