import { Skeleton } from '@/components/ui/skeleton';
import { useSeasons } from '@pelagica/core';
import { getPrimaryImageUrl } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ImageOff } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

const SeasonCard = memo(({ season }: { season: BaseItemDto }) => {
    const { t } = useTranslation(['item', 'common']);
    const [imageError, setImageError] = useState(false);

    return (
        <Link to={`/item/${season.Id}`} key={season.Id} className="group">
            <div className="relative w-full aspect-2/3 rounded-md overflow-hidden bg-muted">
                {!imageError ? (
                    <img
                        src={getPrimaryImageUrl(
                            season.Id!,
                            { width: 300, height: 450 },
                            season.ImageTags?.Primary
                        )}
                        alt={season.Name || t('common:no_title')}
                        className="w-full h-full object-cover rounded-md group-hover:opacity-75 group-hover:scale-105 transition-opacity transition-transform duration-300 ease-out will-change-transform"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-12 h-12 text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
            </div>
            <p className="mt-2 text-md line-clamp-1 text-ellipsis break-all">
                {season.Name || t('item:season_x', { number: season.IndexNumber })}
            </p>
            {season.ChildCount !== undefined && season.ChildCount !== null && (
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('common:episode_count', { count: season.ChildCount })}
                </p>
            )}
        </Link>
    );
});

SeasonCard.displayName = 'SeasonCard';

const SeasonsDisplay = ({
    seriesId,
    title,
}: {
    seriesId: string | null;
    title?: React.ReactNode;
}) => {
    const { data: seasons, isLoading, error } = useSeasons(seriesId);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {title}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="animate-pulse">
                            <Skeleton className="w-full aspect-2/3 rounded-md" />
                            <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4">
                {title}
                <p className="text-destructive">
                    Error loading seasons: {(error as Error).message}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {title}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {seasons?.map((season) => (
                    <SeasonCard key={season.Id} season={season} />
                ))}
            </div>
        </div>
    );
};

export default SeasonsDisplay;
