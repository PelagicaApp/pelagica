import { useQuery } from '@tanstack/react-query';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getApi } from '../api/getApi';
import { getUserId } from '../utils/localstorageCredentials';
import { getRetryConfig } from '../utils/authErrorHandler';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

export function useItemCollections(itemId: string | null | undefined, enabled: boolean = true) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['itemCollections', itemId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getLibraryApi(getApi()).getItemCollections(
                { itemId: itemId!, userId: getUserId() || undefined },
                // Older servers don't have this endpoint; treat 404 as "no collections"
                { validateStatus: (status) => status === 200 || status === 404 }
            );

            if (response.status === 404) return [];
            return response.data.Items || [];
        },
        enabled: !!itemId && enabled,
        ...getRetryConfig(),
    });
}
