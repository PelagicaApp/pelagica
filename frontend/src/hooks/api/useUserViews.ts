import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useUserViews() {
    return useQuery({
        queryKey: ['userViews'],
        queryFn: async () => {
            const api = getApi();
            const userViewsApi = getUserViewsApi(api);
            const response = await userViewsApi.getUserViews();
            return response.data;
        },
        ...getRetryConfig(),
        staleTime: 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
