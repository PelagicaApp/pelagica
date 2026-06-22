import { Skeleton } from '@/components/ui/skeleton';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import WatchedStateBadge from '@/components/WatchedStateBadge';
import { useConfig } from '@/hooks/api/useConfig';

interface MovieTvGridProps {
    items: BaseItemDto[];
}

const MovieTvItem = ({ item }: { item: BaseItemDto }) => {
    const { config } = useConfig();
    const [posterError, setPosterError] = useState(false);
    const posterUrl = getPrimaryImageUrl(
        item.Id || '',
        {
            maxWidth: 416,
            maxHeight: 640,
        },
        item.ImageTags?.Primary,
        85
    );
    const posterAspectRatio = '2/3';

    return (
        <Link to={`/item/${item.Id}`} key={item.Id} className="p-0 m-0">
            <div
                className={`relative w-full aspect-${posterAspectRatio} overflow-hidden rounded-md group`}
            >
                {!posterError ? (
                    <>
                        <img
                            key={item.Id}
                            src={posterUrl}
                            alt={item.Name || 'No Title'}
                            className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105 z-10"
                            loading="lazy"
                            onError={() => setPosterError(true)}
                        />
                        <Skeleton className="absolute bottom-0 left-0 right-0 top-0 -z-1" />
                    </>
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="text-4xl text-muted-foreground" />
                    </div>
                )}
                <WatchedStateBadge item={item} show={config?.watchedStateBadgeSearch || false} />
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
            </div>
            <p className="mt-2 text-sm line-clamp-1 text-ellipsis break-all">
                {item.Name || 'No Title'}
            </p>
            <p className="text-xs text-muted-foreground">
                {item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : ''}
            </p>
        </Link>
    );
};

const MovieTvGrid = ({ items }: MovieTvGridProps) => (
    <div className="w-full gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
        {items.map((item) => (
            <MovieTvItem key={item.Id} item={item} />
        ))}
    </div>
);

export default MovieTvGrid;
