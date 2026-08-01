import { clearCredentials } from '@/utils/localstorageCredentials';
import { getApi } from './getApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import type { QueryClient } from '@tanstack/react-query';
import { logoutFromSeerr } from './seerr/logout';

export async function logout(queryClient: QueryClient) {
    try {
        const sessionApi = getSessionApi(getApi());
        await sessionApi.reportSessionEnded();
    } finally {
        await logoutFromSeerr();
        clearCredentials();
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.invalidateQueries({ queryKey: ['seerrLoginStatus'] });
    }
}
