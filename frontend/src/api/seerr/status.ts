import { getServerUrl } from '@/utils/localstorageCredentials';

export async function getSeerrLoginStatus(): Promise<boolean> {
    try {
        const response = await fetch(
            '/api/seerr/status?jellyfin_url=' + encodeURIComponent(getServerUrl() || ''),
            { credentials: 'include' }
        );
        if (!response.ok) {
            return false;
        }
        const data: { loggedIn: boolean } = await response.json();
        return data.loggedIn;
    } catch (e) {
        console.warn('Seerr status check failed:', e);
        return false;
    }
}
