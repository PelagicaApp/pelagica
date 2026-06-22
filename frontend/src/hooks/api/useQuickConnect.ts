import { useMutation, useQuery } from '@tanstack/react-query';
import { createApi } from '@/api/jellyfinClient';
import { getQuickConnectApi } from '@jellyfin/sdk/lib/utils/api/quick-connect-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { saveCredentials } from '@/utils/localstorageCredentials';

export function useQuickConnectInitiate() {
    return useMutation({
        mutationFn: async (server: string) => {
            const api = createApi(server);
            const res = await getQuickConnectApi(api).initiateQuickConnect();
            return res.data;
        },
    });
}

export function useQuickConnectStatus(
    server: string,
    secret: string | undefined,
    enabled: boolean
) {
    return useQuery({
        queryKey: ['quickConnectStatus', server, secret],
        queryFn: async () => {
            if (!secret) throw new Error('No secret provided');
            const api = createApi(server);
            const res = await getQuickConnectApi(api).getQuickConnectState({ secret });
            return res.data;
        },
        enabled: enabled && !!secret,
        refetchInterval: 2000, // Poll every 2 seconds
        retry: false,
    });
}

export function useQuickConnectAuthenticate() {
    return useMutation({
        mutationFn: async ({ server, secret }: { server: string; secret: string }) => {
            const api = createApi(server);
            const res = await getUserApi(api).authenticateWithQuickConnect({
                quickConnectDto: {
                    Secret: secret,
                },
            });

            const accessToken = res.data.AccessToken || '';
            const userId = res.data.User?.Id || '';

            saveCredentials(server, userId, accessToken);

            return { api, user: res.data.User };
        },
    });
}

export function useAuthorizeQuickConnect() {
    return useMutation({
        mutationFn: async ({ code }: { code: string }) => {
            if (!code) throw new Error('No code provided');
            const { getApi } = await import('@/api/getApi');
            const api = getApi();
            const res = await getQuickConnectApi(api).authorizeQuickConnect({ code });
            return res.data;
        },
    });
}
