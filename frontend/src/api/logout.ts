import { clearCredentials } from '@/utils/localstorageCredentials';
import { getApi } from './getApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';

export async function logout() {
    try {
        const sessionApi = getSessionApi(getApi());
        await sessionApi.reportSessionEnded();
    } finally {
        clearCredentials();
    }
}
