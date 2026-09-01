import { useQuery } from '@tanstack/react-query';
import type { SeerrSearchResultItem } from '../api/seerr/types';
import type { SeerrResolvedSlider } from '../api/seerr/sliderResolve';
import { getServerUrl } from '../utils/localstorageCredentials';
import {
    getSeerrDiscoverSliders,
    getSeerrPopularMovies,
    getSeerrPopularSeries,
    getSeerrSliderItems,
    getSeerrTrending,
} from '../api/seerr/discover';

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

export function useSeerrDiscoverSliders(enabled: boolean) {
    return useQuery<SeerrResolvedSlider[]>({
        queryKey: ['seerrDiscoverSliders', getServerUrl()],
        queryFn: getSeerrDiscoverSliders,
        enabled,
        ...discoverQueryOptions,
    });
}

export function useSeerrSliderItems(slider: SeerrResolvedSlider | undefined, enabled: boolean) {
    return useQuery<SeerrSearchResultItem[]>({
        queryKey: [
            'seerrSliderItems',
            slider?.id,
            slider?.path,
            slider?.query,
            getServerUrl(),
        ],
        queryFn: () => getSeerrSliderItems(slider!),
        enabled: enabled && !!slider,
        ...discoverQueryOptions,
    });
}

export function useSeerrResolvedSlider(sliderId: number | undefined, enabled: boolean) {
    const query = useSeerrDiscoverSliders(enabled && sliderId != null);
    return {
        ...query,
        slider: query.data?.find((slider) => slider.id === sliderId),
    };
}
