import { Skeleton } from '@/components/ui/skeleton';
import type { SeerrSearchResultItem } from '@/api/seerr/types';
import { getSeerrItemPosterUrl } from '@/utils/seerUrls';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { useSeerrItemClick } from '@/hooks/useSeerrItemClick';
import SeerrStatusBadge from '@/components/SeerrStatusBadge';

interface SeerrSearchGridProps {
    items: SeerrSearchResultItem[];
}

const SeerrSearchGridItem = ({ item }: { item: SeerrSearchResultItem }) => {
    const [posterFailed, setPosterFailed] = useState(false);
    const handleClick = useSeerrItemClick();

    return (
        <button
            type="button"
            onClick={() => handleClick(item)}
            className="p-0 m-0 text-left cursor-pointer"
        >
            <div className="relative w-full aspect-2/3 overflow-hidden rounded-md group bg-muted">
                {item.posterPath && !posterFailed ? (
                    <img
                        src={getSeerrItemPosterUrl(item.posterPath)}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105 z-10"
                        loading="lazy"
                        onError={() => setPosterFailed(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="text-4xl text-muted-foreground" />
                    </div>
                )}
                <Skeleton className="absolute bottom-0 left-0 right-0 top-0 -z-1" />
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                <SeerrStatusBadge
                    mediaInfo={item.mediaInfo}
                    className="absolute top-1.5 left-1.5 z-30"
                />
            </div>
            <p className="mt-2 text-sm line-clamp-1 text-ellipsis break-all">{item.title}</p>
            <p className="text-xs text-muted-foreground">
                {item.releaseDate ? new Date(item.releaseDate).getFullYear() : ''}
            </p>
        </button>
    );
};

const SeerrSearchGrid = ({ items }: SeerrSearchGridProps) => (
    <div className="w-full gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
        {items.map((item) => (
            <SeerrSearchGridItem key={`${item.mediaType}-${item.id}`} item={item} />
        ))}
    </div>
);

export default SeerrSearchGrid;
