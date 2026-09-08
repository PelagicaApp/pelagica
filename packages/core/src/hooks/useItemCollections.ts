import { useQuery } from '@tanstack/react-query';
import type {
    BaseItemDto,
    BaseItemDtoQueryResult,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getApi } from '../api/getApi';
import { getUserId } from '../utils/localstorageCredentials';
import { getRetryConfig } from '../utils/authErrorHandler';

/**
 * Lightweight check for which collections (BoxSets) contain the given item.
 * Requests no additional fields, images or user data — only the minimal
 * collection metadata needed to know membership and render row headings.
 */
export function useItemCollections(itemId: string | null | undefined, enabled: boolean = true) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['itemCollections', itemId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const response = await api.axiosInstance.get<BaseItemDtoQueryResult>(
                `${api.basePath}/Items/${itemId}/Collections`,
                {
                    params: {
                        userId: getUserId() || undefined,
                        enableImages: false,
                        enableUserData: false,
                        enableTotalRecordCount: false,
                    },
                    headers: { Authorization: api.authorizationHeader },
                    // Older servers don't have this endpoint; treat 404 as "no collections"
                    validateStatus: (status) => status === 200 || status === 404,
                }
            );
            if (response.status === 404) return [];
            return response.data.Items || [];
        },
        enabled: !!itemId && enabled,
        ...getRetryConfig(),
    });
}
