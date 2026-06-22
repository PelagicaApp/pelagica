import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function usePerson(itemId: string | null | undefined, userId?: string | undefined) {
    return useQuery<BaseItemDto>({
        queryKey: ['person', itemId],
        queryFn: async (): Promise<BaseItemDto> => {
            const api = getApi();
            const userLibraryApi = getUserLibraryApi(api);
            const response = await userLibraryApi.getItem({
                itemId: itemId!,
                userId,
            });
            const item = response.data;
            if (!item) {
                throw new Error(`Item not found: ${itemId}`);
            }
            return item;
        },
        enabled: !!itemId,
        ...getRetryConfig(),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
