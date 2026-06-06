import type { GenreWithItem } from '@/hooks/api/genres/useGenresWithItems';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { useState } from 'react';
import { Link } from 'react-router';
import { Skeleton } from './ui/skeleton';
import { ImageOff } from 'lucide-react';

const GenreItem = ({
    genreWithItem,
    className,
    titleClassName,
}: {
    genreWithItem: GenreWithItem;
    className?: string;
    titleClassName?: string;
}) => {
    const [posterError, setPosterError] = useState(false);
    const posterUrl = getPrimaryImageUrl(genreWithItem.item?.Id || '', {
        maxWidth: 416,
        maxHeight: 640,
    });

    return (
        <Link
            to={`/item/${genreWithItem.id}`}
            key={genreWithItem.id}
            className={`p-0 m-0 ${className || ''}`}
        >
            <div className={`relative w-full aspect-video overflow-hidden rounded-md group`}>
                {!posterError ? (
                    <>
                        <img
                            src={posterUrl}
                            alt={genreWithItem.item?.Name || 'No Title'}
                            className="absolute inset-0 w-full h-full object-cover transition-all group-hover:scale-105 group-hover:opacity-75 grayscale"
                            loading="lazy"
                            onError={() => setPosterError(true)}
                        />
                        <Skeleton className="absolute inset-0 -z-10" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="text-4xl text-muted-foreground" />
                    </div>
                )}

                <div
                    className="absolute inset-0 rounded-md z-10"
                    style={{
                        backgroundColor: genreWithItem.tint,
                        opacity: 0.35,
                    }}
                />

                <div className="absolute inset-0 z-20 rounded-md bg-linear-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-2 left-2 right-2 z-30">
                    <p
                        className={
                            titleClassName ||
                            `text-2xl font-semibold text-gray-300 drop-shadow line-clamp-2`
                        }
                    >
                        {genreWithItem.name}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default GenreItem;
