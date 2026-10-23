import { withBasePath } from '../../utils/basePath';
import { getServerUrl } from '../../utils/localstorageCredentials';
import { isSeerrAutoLoginDisabled } from './autoLogin';
import { loginToSeerrWithQuickConnect } from './quickConnect';

let pendingAutoLogin: Promise<boolean> | null = null;

function autoLoginToSeerr(server: string): Promise<boolean> {
    if (isSeerrAutoLoginDisabled(server)) return Promise.resolve(false);
    pendingAutoLogin ??= loginToSeerrWithQuickConnect(server)
        .then(() => true)
        .catch(() => false)
        .finally(() => {
            pendingAutoLogin = null;
        });
    return pendingAutoLogin;
}

export async function getSeerrLoginStatus(): Promise<boolean> {
    const server = getServerUrl() || '';
    try {
        const response = await fetch(
            withBasePath('/api/seerr/status?jellyfin_url=' + encodeURIComponent(server)),
            { credentials: 'include' }
        );
        if (!response.ok) {
            return false;
        }
        const data: { loggedIn: boolean } = await response.json();
        if (!data.loggedIn && server) {
            return autoLoginToSeerr(server);
        }
        return data.loggedIn;
    } catch (e) {
        console.warn('Seerr status check failed:', e);
        return false;
    }
}
