import { withBasePath } from '../../utils/basePath';
import { setSeerrAutoLoginDisabled } from './autoLogin';

export async function loginToSeerr(
    server: string,
    username: string,
    password: string
): Promise<boolean> {
    const response = await fetch(
        withBasePath('/api/seerr/login?jellyfin_url=' + encodeURIComponent(server)),
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        }
    );
    if (response.ok) setSeerrAutoLoginDisabled(server, false);
    return response.ok;
}
