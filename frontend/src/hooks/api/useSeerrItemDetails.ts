import { useQuery } from '@tanstack/react-query';
import type { SeerrItemDetails, SeerrMediaType } from '@/api/seerr/types';
import { getServerUrl } from '@/utils/localstorageCredentials';
import { getSeerrItemDetails } from '@/api/seerr/details';

export function useSeerrItemDetails(
    mediaType: SeerrMediaType | undefined,
    id: number | undefined,
    enabled: boolean
) {
    return useQuery<SeerrItemDetails>({
        queryKey: ['seerrItemDetails', mediaType, id, getServerUrl()],
        queryFn: () => getSeerrItemDetails(mediaType!, id!),
        enabled: enabled && !!mediaType && id !== undefined,
        refetchOnWindowFocus: false,
        staleTime: 60 * 1000,
    });
}
