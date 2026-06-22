import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useCurrentUser() {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const api = getApi();
            const userApi = getUserApi(api);
            const response = await userApi.getCurrentUser();
            return response.data;
        },
        ...getRetryConfig(),
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
    });
}
