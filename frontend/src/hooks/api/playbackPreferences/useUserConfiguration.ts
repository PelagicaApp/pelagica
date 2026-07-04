import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import type { UserConfiguration, UserDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useUserConfiguration(userId: string | null | undefined) {
    return useQuery<UserConfiguration>({
        queryKey: ['userConfiguration', userId],
        queryFn: async () => {
            const api = getApi();
            const userApi = getUserApi(api);

            const response = await userApi.getUserById({
                userId: userId!,
            });

            const user: UserDto = response.data;
            const config = user.Configuration;

            if (!config) {
                throw new Error(`User configuration not found: ${userId}`);
            }

            return config;
        },
        enabled: !!userId,
        ...getRetryConfig(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
