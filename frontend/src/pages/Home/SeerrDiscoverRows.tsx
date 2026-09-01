import { memo } from 'react';
import type React from 'react';
import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeerrLoginStatus } from '@pelagica/core';
import {
    useSeerrPopularMovies,
    useSeerrPopularSeries,
    useSeerrResolvedSlider,
    useSeerrSliderItems,
    useSeerrTrending,
} from '@pelagica/core';
import type { SeerrSearchResultItem } from '@pelagica/core';
import { SeerrRecommendationPoster } from '../Item/SeerrRecommendationsRow';
import { ChevronRight } from 'lucide-react';
import { useConfig } from '@pelagica/core';
import { ExternalAnchor } from '@/components/ExternalAnchor';

interface SeerrDiscoverRowProps {
    title?: React.ReactNode;
    allLink?: string;
}

const skeletonItems = Array.from({ length: 5 }, (_, index) => (
    <div key={index} className="w-36 lg:w-44 2xl:w-52">
        <Skeleton className="w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80 rounded-md mb-2" />
        <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-1" />
        <Skeleton className="w-20 lg:w-24 2xl:w-28 h-3" />
    </div>
));

const getDiscoverUrl = (seerrUrl: string | undefined, type: 'trending' | 'movies' | 'tv') => {
    if (!seerrUrl) return undefined;
    const url = new URL(seerrUrl);
    url.pathname = `/discover/${type}`;
    return url.toString();
};

const buildPosterElements = (items: SeerrSearchResultItem[] | undefined) =>
    items?.map((item) => (
        <SeerrRecommendationPoster
            key={`${item.mediaType}-${item.id}`}
            tmdbId={item.id}
            mediaType={item.mediaType}
            title={item.title}
            posterPath={item.posterPath}
            year={
                item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : undefined
            }
            mediaInfo={item.mediaInfo}
        />
    )) ?? [];

const SeerrDiscoverRowBase = ({
    title,
    allLink,
    items,
    isLoading,
}: SeerrDiscoverRowProps & { items: SeerrSearchResultItem[] | undefined; isLoading: boolean }) => {
    if (isLoading) {
        return <SectionScroller title={title} items={skeletonItems} contentInset />;
    }

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <SectionScroller
            title={
                allLink ? (
                    <ExternalAnchor
                        href={allLink}
                        className="flex items-center gap-1 group cursor-pointer w-fit transition-colors"
                    >
                        <h2 className="text-2xl font-bold">{title}</h2>
                        <ChevronRight className="w-7 h-7 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </ExternalAnchor>
                ) : (
                    <h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>
                )
            }
            items={buildPosterElements(items)}
            contentInset
        />
    );
};

export const SeerrTrendingRow: React.FC<SeerrDiscoverRowProps> = memo(({ title }) => {
    const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
    const { data: items, isLoading } = useSeerrTrending(!!isLoggedIn);
    const { config } = useConfig();

    if (isLoadingLoginStatus || !isLoggedIn) return null;

    return (
        <SeerrDiscoverRowBase
            title={title}
            allLink={getDiscoverUrl(config.seerrUrl, 'trending')}
            items={items}
            isLoading={isLoading}
        />
    );
});
SeerrTrendingRow.displayName = 'SeerrTrendingRow';

export const SeerrPopularMoviesRow: React.FC<SeerrDiscoverRowProps> = memo(({ title }) => {
    const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
    const { data: items, isLoading } = useSeerrPopularMovies(!!isLoggedIn);
    const { config } = useConfig();

    if (isLoadingLoginStatus || !isLoggedIn) return null;

    return (
        <SeerrDiscoverRowBase
            title={title}
            allLink={getDiscoverUrl(config.seerrUrl, 'movies')}
            items={items}
            isLoading={isLoading}
        />
    );
});
SeerrPopularMoviesRow.displayName = 'SeerrPopularMoviesRow';

export const SeerrPopularSeriesRow: React.FC<SeerrDiscoverRowProps> = memo(({ title }) => {
    const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
    const { data: items, isLoading } = useSeerrPopularSeries(!!isLoggedIn);
    const { config } = useConfig();

    if (isLoadingLoginStatus || !isLoggedIn) return null;

    return (
        <SeerrDiscoverRowBase
            title={title}
            allLink={getDiscoverUrl(config.seerrUrl, 'tv')}
            items={items}
            isLoading={isLoading}
        />
    );
});
SeerrPopularSeriesRow.displayName = 'SeerrPopularSeriesRow';

const sliderAllLink = (seerrUrl: string | undefined, linkPath: string) => {
    if (!seerrUrl) return undefined;
    return `${seerrUrl.replace(/\/$/, '')}${linkPath.startsWith('/') ? linkPath : `/${linkPath}`}`;
};

const SeerrSliderRow: React.FC<{
    sliderId: number;
    title?: string;
    seerrUrl?: string;
}> = memo(({ sliderId, title, seerrUrl }) => {
    const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
    const { slider, isLoading: isLoadingSlider } = useSeerrResolvedSlider(sliderId, !!isLoggedIn);
    const { data: items, isLoading } = useSeerrSliderItems(slider, !!isLoggedIn && !!slider);

    if (isLoadingLoginStatus || !isLoggedIn) return null;

    if (isLoadingSlider || !slider) {
        return <SeerrDiscoverRowBase title={title} items={undefined} isLoading={isLoadingSlider} />;
    }

    return (
        <SeerrDiscoverRowBase
            title={title || slider.title}
            allLink={sliderAllLink(seerrUrl, slider.linkPath)}
            items={items}
            isLoading={isLoading}
        />
    );
});
SeerrSliderRow.displayName = 'SeerrSliderRow';

export const SeerrDiscoverSliderRow = memo(
    ({ sliderId, title }: { sliderId: number; title?: string }) => {
        const { config } = useConfig();
        return <SeerrSliderRow sliderId={sliderId} title={title} seerrUrl={config.seerrUrl} />;
    }
);
SeerrDiscoverSliderRow.displayName = 'SeerrDiscoverSliderRow';
