import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { getApi } from '../api/getApi';
import {
    isSeerrQuickConnectSupported,
    loginToSeerrWithQuickConnect,
} from '../api/seerr/quickConnect';
import { getAccessToken, getServerUrl, getUserId } from '../utils/localstorageCredentials';
import { useConfig } from './useConfig';

export function useSeerrQuickConnectSupported() {
    const { config } = useConfig();
    const seerrUrl = config?.seerrUrl;
    const server = getServerUrl();

    return useQuery({
        queryKey: ['seerrQuickConnectSupported', seerrUrl, server, getUserId()],
        queryFn: async () => {
            if (!server) return false;
            const [jellyfinEnabled, seerrSupported] = await Promise.all([
                getAuthenticationApi(getApi())
                    .getQuickConnectEnabled()
                    .then((res) => res.data === true)
                    .catch(() => false),
                isSeerrQuickConnectSupported(server),
            ]);
            return jellyfinEnabled && seerrSupported;
        },
        enabled: !!seerrUrl && !!server && !!getAccessToken(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useSeerrQuickConnectLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const server = getServerUrl();
            if (!server) throw new Error('Server URL not set');
            await loginToSeerrWithQuickConnect(server);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seerrLoginStatus'] });
        },
    });
}
