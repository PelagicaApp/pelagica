import { memo } from 'react';
import {
    useSeerrLoginStatus,
    useSeerrPopularMovies,
    useSeerrPopularSeries,
    useSeerrResolvedSlider,
    useSeerrSliderItems,
    useSeerrTrending,
    type SeerrSearchResultItem,
} from '@pelagica/core';
import ScrollableHomeSection from './ScrollableHomeSection';
import { Skeleton } from '../ui/skeleton';
import SeerrPosterCard from '../SeerrPosterCard';

const posterSkeletons = Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="w-40">
        <Skeleton className="mb-2 h-54 w-40 rounded-md" />
        <Skeleton className="mb-1 h-4 w-36" />
        <Skeleton className="h-3 w-24" />
    </div>
));

const SeerrDiscoverRow = ({
    title,
    items,
    isLoading,
}: {
    title: string;
    items: SeerrSearchResultItem[] | undefined;
    isLoading: boolean;
}) => {
    if ((!items || items.length === 0) && !isLoading) return null;

    return (
        <ScrollableHomeSection title={title} focusable={!!items}>
            {items
                ? items.map((item) => (
                      <SeerrPosterCard key={`${item.mediaType}-${item.id}`} item={item} />
                  ))
                : posterSkeletons}
        </ScrollableHomeSection>
    );
};

export const SeerrTrendingRow = memo(({ title }: { title: string }) => {
    const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
    const { data: items, isLoading } = useSeerrTrending(!!isLoggedIn);

    if (isLoadingLoginStatus || !isLoggedIn) return null;
    return <SeerrDiscoverRow title={title} items={items} isLoading={isLoading} />;
});
SeerrTrendingRow.displayName = 'SeerrTrendingRow';

export const SeerrPopularMoviesRow = memo(({ title }: { title: string }) => {
    const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
    const { data: items, isLoading } = useSeerrPopularMovies(!!isLoggedIn);

    if (isLoadingLoginStatus || !isLoggedIn) return null;
    return <SeerrDiscoverRow title={title} items={items} isLoading={isLoading} />;
});
SeerrPopularMoviesRow.displayName = 'SeerrPopularMoviesRow';

export const SeerrPopularSeriesRow = memo(({ title }: { title: string }) => {
    const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
    const { data: items, isLoading } = useSeerrPopularSeries(!!isLoggedIn);

    if (isLoadingLoginStatus || !isLoggedIn) return null;
    return <SeerrDiscoverRow title={title} items={items} isLoading={isLoading} />;
});
SeerrPopularSeriesRow.displayName = 'SeerrPopularSeriesRow';

export const SeerrDiscoverSliderRow = memo(
    ({ sliderId, title }: { sliderId: number; title?: string }) => {
        const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
        const { slider, isLoading: isLoadingSlider } = useSeerrResolvedSlider(
            sliderId,
            !!isLoggedIn
        );
        const { data: items, isLoading } = useSeerrSliderItems(
            slider,
            !!isLoggedIn && !!slider
        );

        if (isLoadingLoginStatus || !isLoggedIn) return null;
        if (isLoadingSlider || !slider) {
            return (
                <SeerrDiscoverRow
                    title={title || ''}
                    items={undefined}
                    isLoading={isLoadingSlider}
                />
            );
        }
        return (
            <SeerrDiscoverRow
                title={title || slider.title}
                items={items}
                isLoading={isLoading}
            />
        );
    }
);
SeerrDiscoverSliderRow.displayName = 'SeerrDiscoverSliderRow';
