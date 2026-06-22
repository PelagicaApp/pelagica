import { clearCredentials } from '@/utils/localstorageCredentials';
import { getApi } from './getApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import type { QueryClient } from '@tanstack/react-query';

export async function logout(queryClient: QueryClient) {
    try {
        const sessionApi = getSessionApi(getApi());
        await sessionApi.reportSessionEnded();
    } finally {
        clearCredentials();
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
}
