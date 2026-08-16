import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeerrPersonCombinedCredits } from '@pelagica/core';
import { useSeerrLoginStatus } from '@pelagica/core';
import type { SeerrPersonCastCredit, SeerrPersonCrewCredit } from '@pelagica/core';
import { memo, useMemo } from 'react';
import type React from 'react';
import { SeerrRecommendationPoster } from '../Item/SeerrRecommendationsRow';

interface SeerrPersonCreditsRowProps {
    title?: React.ReactNode;
    tmdbPersonId: string;
}

const skeletonItems = Array.from({ length: 5 }, (_, index) => (
    <div key={index} className="w-36 lg:w-44 2xl:w-52">
        <Skeleton className="w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80 rounded-md mb-2" />
        <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-1" />
        <Skeleton className="w-20 lg:w-24 2xl:w-28 h-3" />
    </div>
));

const SeerrPersonCreditsRow: React.FC<SeerrPersonCreditsRowProps> = memo(
    ({ title, tmdbPersonId }) => {
        const { data: isLoggedIn, isLoading: isLoadingLoginStatus } = useSeerrLoginStatus();
        const { data: credits, isLoading } = useSeerrPersonCombinedCredits(
            isLoggedIn ? tmdbPersonId : undefined
        );

        const itemElements = useMemo(() => {
            if (!credits) return [];

            const combined: (SeerrPersonCastCredit | SeerrPersonCrewCredit)[] = [
                ...credits.cast,
                ...credits.crew,
            ];

            const seen = new Set<string>();
            const unique = combined.filter((credit) => {
                const key = `${credit.mediaType}-${credit.id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            unique.sort((a, b) => {
                const dateA = a.releaseDate || a.firstAirDate;
                const dateB = b.releaseDate || b.firstAirDate;
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateB.localeCompare(dateA);
            });

            return unique.map((credit) => {
                const date = credit.releaseDate || credit.firstAirDate;
                return (
                    <SeerrRecommendationPoster
                        key={`${credit.mediaType}-${credit.id}`}
                        tmdbId={credit.id}
                        mediaType={credit.mediaType}
                        title={credit.title || credit.name || ''}
                        posterPath={credit.posterPath}
                        year={date ? new Date(date).getFullYear().toString() : undefined}
                        mediaInfo={credit.mediaInfo}
                    />
                );
            });
        }, [credits]);

        if (isLoadingLoginStatus || !isLoggedIn) {
            return null;
        }

        if (isLoading) {
            return <SectionScroller title={title} items={skeletonItems} />;
        }

        if (itemElements.length === 0) {
            return null;
        }

        return <SectionScroller title={title} items={itemElements} />;
    }
);

SeerrPersonCreditsRow.displayName = 'SeerrPersonCreditsRow';

export default SeerrPersonCreditsRow;
