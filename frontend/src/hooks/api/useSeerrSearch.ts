import { useQuery } from '@tanstack/react-query';
import type { SeerrSearchResultItem } from '@/api/seerr/types';
import { getServerUrl } from '@/utils/localstorageCredentials';
import { searchSeerr } from '@/api/seerr/search';

export function useSeerrSearch(query: string | undefined) {
    return useQuery<SeerrSearchResultItem[]>({
        queryKey: ['seerrSearch', query, getServerUrl()],
        queryFn: () => searchSeerr(query!),
        enabled: !!query,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
