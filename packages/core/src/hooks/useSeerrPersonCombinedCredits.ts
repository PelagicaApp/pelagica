import { useQuery } from '@tanstack/react-query';
import type { SeerrPersonCombinedCreditsResponse } from '../api/seerr/types';
import { getServerUrl } from '../utils/localstorageCredentials';
import { getSeerrPersonCombinedCredits } from '../api/seerr/person';

export function useSeerrPersonCombinedCredits(personId: string | undefined) {
    return useQuery<SeerrPersonCombinedCreditsResponse>({
        queryKey: ['seerrPersonCombinedCredits', personId, getServerUrl()],
        queryFn: () => getSeerrPersonCombinedCredits(personId!),
        enabled: !!personId,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
