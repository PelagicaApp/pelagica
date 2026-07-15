import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeerrRecommendations } from '@/hooks/api/useSeerrRecommendations';
import { useSeerrLoginStatus } from '@/hooks/api/useSeerrLoginStatus';
import type { SeerrMediaInfo, SeerrMediaType } from '@/api/seerr/types';
import { ImageOff } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import type React from 'react';
import { getSeerrItemPosterUrl } from '../../utils/seerUrls';
import { useSeerrItemClick } from '@/hooks/useSeerrItemClick';
import SeerrStatusBadge from '@/components/SeerrStatusBadge';

interface SeerrRecommendationsRowProps {
    title?: React.ReactNode;
    tmdbId: string;
    mediaType: SeerrMediaType;
}

const skeletonItems = Array.from({ length: 5 }, (_, index) => (
    <div key={index} className="w-36 lg:w-44 2xl:w-52">
        <Skeleton className="w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80 rounded-md mb-2" />
        <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-1" />
        <Skeleton className="w-20 lg:w-24 2xl:w-28 h-3" />
    </div>
));

const SeerrRecommendationPoster = ({
    tmdbId,
    mediaType,
    title,
    posterPath,
    year,
    mediaInfo,
}: {
    tmdbId: number;
    mediaType: SeerrMediaType;
    title: string;
    posterPath?: string;
    year?: string;
    mediaInfo?: SeerrMediaInfo;
}) => {
    const [posterFailed, setPosterFailed] = useState(false);
    const handleClick = useSeerrItemClick();

    return (
        <button
            type="button"
            onClick={() => handleClick({ id: tmdbId, mediaType, mediaInfo })}
            className="w-36 lg:w-44 2xl:w-52 shrink-0 text-left cursor-pointer"
        >
            <div className="relative overflow-hidden rounded-md group w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80 bg-muted">
                {posterPath && !posterFailed ? (
                    <img
                        src={getSeerrItemPosterUrl(posterPath)}
                        alt={title}
                        className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105 transform-gpu will-change-transform"
                        loading="lazy"
                        onError={() => setPosterFailed(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="text-muted-foreground" size={32} />
                    </div>
                )}
                <SeerrStatusBadge mediaInfo={mediaInfo} className="absolute top-1.5 left-1.5" />
            </div>
            <p className="mt-2 text-sm line-clamp-1 text-ellipsis break-all max-w-36 lg:max-w-44 2xl:max-w-52">
                {title}
            </p>
            {year && <span className="text-xs text-muted-foreground mt-1">{year}</span>}
        </button>
    );
};

const SeerrRecommendationsRow: React.FC<SeerrRecommendationsRowProps> = memo(
    ({ title, tmdbId, mediaType }) => {
        const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
        const { data: recommendations, isLoading } = useSeerrRecommendations(
            mediaType,
            isLoggedIn ? tmdbId : undefined
        );

        const itemElements = useMemo(() => {
            if (!recommendations) return [];
            return recommendations.map((item) => (
                <SeerrRecommendationPoster
                    key={item.id}
                    tmdbId={item.id}
                    mediaType={mediaType}
                    title={item.title}
                    posterPath={item.posterPath}
                    year={
                        item.releaseDate
                            ? new Date(item.releaseDate).getFullYear().toString()
                            : undefined
                    }
                    mediaInfo={item.mediaInfo}
                />
            ));
        }, [recommendations, mediaType]);

        if (isLoadingLoginStatus || !isLoggedIn) {
            return null;
        }

        if (isLoading) {
            return <SectionScroller title={title} items={skeletonItems} />;
        }

        if (!recommendations || recommendations.length === 0) {
            return null;
        }

        return <SectionScroller title={title} items={itemElements} />;
    }
);

SeerrRecommendationsRow.displayName = 'SeerrRecommendationsRow';

export default SeerrRecommendationsRow;
