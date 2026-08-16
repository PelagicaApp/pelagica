import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useLocalTrailers(itemId: string | undefined, enabled: boolean) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['localTrailers', itemId],
        queryFn: async () => {
            const api = getApi();
            const userLibraryApi = getUserLibraryApi(api);
            const response = await userLibraryApi.getLocalTrailers({ itemId: itemId! });
            return response.data;
        },
        enabled: !!itemId && enabled,
        ...getRetryConfig(),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
