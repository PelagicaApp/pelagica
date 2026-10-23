import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { withBasePath } from '../../utils/basePath';
import { getApi } from '../getApi';
import { setSeerrAutoLoginDisabled } from './autoLogin';

function seerrQuickConnectUrl(path: string, server: string): string {
    return withBasePath(
        '/api/seerr/quickconnect/' + path + '?jellyfin_url=' + encodeURIComponent(server)
    );
}

export async function isSeerrQuickConnectSupported(server: string): Promise<boolean> {
    try {
        const response = await fetch(seerrQuickConnectUrl('supported', server), {
            credentials: 'include',
        });
        if (!response.ok) return false;
        const data: { supported: boolean } = await response.json();
        return data.supported;
    } catch {
        return false;
    }
}

export async function loginToSeerrWithQuickConnect(server: string): Promise<void> {
    const initiateResponse = await fetch(seerrQuickConnectUrl('initiate', server), {
        method: 'POST',
        credentials: 'include',
    });
    if (!initiateResponse.ok) {
        throw new Error('Failed to initiate Seerr Quick Connect');
    }
    const { code, secret }: { code: string; secret: string } = await initiateResponse.json();

    await getAuthenticationApi(getApi()).authorizeQuickConnect({ code });

    const authenticateResponse = await fetch(seerrQuickConnectUrl('authenticate', server), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secret }),
    });
    if (!authenticateResponse.ok) {
        throw new Error('Failed to authenticate with Seerr Quick Connect');
    }
    setSeerrAutoLoginDisabled(server, false);
}
