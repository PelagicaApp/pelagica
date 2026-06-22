import { getAccessToken, getServerUrl } from '@/utils/localstorageCredentials';
import { createApi } from './jellyfinClient';

export function getApi() {
    const server = getServerUrl();
    const token = getAccessToken();

    if (!server || !token) throw new Error('Not authenticated');

    return createApi(server, token);
}

export function getUnauthenticatedApi() {
    const server = getServerUrl();

    if (!server) throw new Error('Server URL not set');

    return createApi(server);
}

export function getAuthorizationHeader(): string {
    const api = getApi();
    return api.authorizationHeader;
}
