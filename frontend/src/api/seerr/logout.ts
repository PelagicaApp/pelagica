import { getServerUrl } from '@/utils/localstorageCredentials';

export async function logoutFromSeerr(): Promise<void> {
    try {
        const server = getServerUrl();
        await fetch(
            '/api/seerr/logout' + (server ? '?jellyfin_url=' + encodeURIComponent(server) : ''),
            { method: 'POST', credentials: 'include' }
        );
    } catch (e) {
        // seerr logout is best effort and shouldn't block jellyfin logout
        console.warn('Seerr logout failed:', e);
    }
}
