import { getServerUrl } from '../../utils/localstorageCredentials';
import type { SeerrPersonCombinedCreditsResponse } from './types';

export async function getSeerrPersonCombinedCredits(
    personId: string
): Promise<SeerrPersonCombinedCreditsResponse> {
    const response = await fetch(
        `/api/seerr/person/${personId}/combined_credits?jellyfin_url=${encodeURIComponent(getServerUrl() || '')}`
    );
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
}
