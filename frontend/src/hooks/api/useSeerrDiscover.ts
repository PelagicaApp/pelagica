import { useQuery } from '@tanstack/react-query';
import type { SeerrSearchResultItem } from '@/api/seerr/types';
import { getServerUrl } from '@/utils/localstorageCredentials';
import {
    getSeerrPopularMovies,
    getSeerrPopularSeries,
    getSeerrTrending,
} from '@/api/seerr/discover';

const discoverQueryOptions = {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
};

export function useSeerrTrending(enabled: boolean) {
    return useQuery<SeerrSearchResultItem[]>({
        queryKey: ['seerrTrending', getServerUrl()],
        queryFn: getSeerrTrending,
        enabled,
        ...discoverQueryOptions,
    });
}

export function useSeerrPopularMovies(enabled: boolean) {
    return useQuery<SeerrSearchResultItem[]>({
        queryKey: ['seerrPopularMovies', getServerUrl()],
        queryFn: getSeerrPopularMovies,
        enabled,
        ...discoverQueryOptions,
    });
}

export function useSeerrPopularSeries(enabled: boolean) {
    return useQuery<SeerrSearchResultItem[]>({
        queryKey: ['seerrPopularSeries', getServerUrl()],
        queryFn: getSeerrPopularSeries,
        enabled,
        ...discoverQueryOptions,
    });
}
