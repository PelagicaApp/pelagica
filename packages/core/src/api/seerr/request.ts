import { withBasePath } from '../../utils/basePath';
import { getServerUrl } from '../../utils/localstorageCredentials';
import type { SeerrRequestPayload } from './types';

export async function requestSeerrItem(payload: SeerrRequestPayload): Promise<void> {
    const response = await fetch(
        withBasePath(`/api/seerr/request?jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`),
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
}
