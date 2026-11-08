import { withBasePath } from '../../utils/basePath';
import { getServerUrl } from '../../utils/localstorageCredentials';
import { setSeerrAutoLoginDisabled } from './autoLogin';

export async function logoutFromSeerr(disableAutoLogin = false): Promise<void> {
    const server = getServerUrl();
    if (server) setSeerrAutoLoginDisabled(server, disableAutoLogin);
    try {
        await fetch(
            withBasePath(
                '/api/seerr/logout' + (server ? '?jellyfin_url=' + encodeURIComponent(server) : '')
            ),
            { method: 'POST', credentials: 'include' }
        );
    } catch (e) {
        // seerr logout is best effort and shouldn't block jellyfin logout
        console.warn('Seerr logout failed:', e);
    }
}
