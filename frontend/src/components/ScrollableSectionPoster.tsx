import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Link } from 'react-router';
import { Skeleton } from './ui/skeleton';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { useConfig } from '@/hooks/api/useConfig';
import WatchedStateBadge from './WatchedStateBadge';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ScrollableSectionPosterProps {
    item?: BaseItemDto;
    posterUrl?: string;
    children?: React.ReactNode;
    itemName?: string;
    itemId?: string;
    className?: string;
}

const ScrollableSectionPoster = ({
    item,
    posterUrl,
    children,
    itemName,
    itemId,
    className,
}: ScrollableSectionPosterProps) => {
    const { config } = useConfig();
    const [posterFailed, setPosterFailed] = useState(false);

    const isArtist = item?.Type === 'MusicArtist';
    const isSquareType = item?.Type === 'Playlist' || item?.Type === 'MusicAlbum' || isArtist;
    const posterClasses = isSquareType
        ? 'w-36 h-36 lg:w-44 lg:h-44 2xl:w-52 2xl:h-52'
        : 'w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80';
    const minPosterClasses = isSquareType
        ? 'min-w-36 lg:min-w-44 2xl:min-w-52 min-h-36 lg:min-h-44 2xl:min-h-52'
        : 'min-w-36 lg:min-w-44 2xl:min-w-52 min-h-54 lg:min-h-64 2xl:min-h-80';
    const skeletonClasses = isSquareType ? 'h-36 lg:h-44 2xl:h-52' : 'h-54 lg:h-64 2xl:h-80';
    const roundedClass = isArtist ? 'rounded-full' : 'rounded-md';

    const primaryImageTag = item?.ImageTags?.Primary;

    const MUSIC_ROUTES: Record<string, string> = {
        MusicAlbum: '/music/album',
        MusicArtist: '/music/artist',
        Playlist: '/music/playlist',
    };
    const id = itemId || item?.Id;
    const linkTo =
        item?.Type && MUSIC_ROUTES[item.Type] ? `${MUSIC_ROUTES[item.Type]}/${id}` : `/item/${id}`;

    if (posterFailed) {
        return (
            <Link to={linkTo} key={id} className={className}>
                <div
                    className={`relative overflow-hidden ${roundedClass} group ${posterClasses} bg-muted flex items-center justify-center`}
                >
                    <ImageOff className="text-muted-foreground" size={32} />
                    <WatchedStateBadge
                        item={item}
                        show={config?.watchedStateBadgeHomeScreen || false}
                    />
                </div>
                <p className="mt-2 text-sm line-clamp-1 text-ellipsis break-all max-w-36 lg:max-w-44 2xl:max-w-52">
                    {itemName || item?.Name || ''}
                </p>
                {children}
            </Link>
        );
    }

    return (
        <Link to={linkTo} key={id} className={className}>
            <div className={`relative overflow-hidden ${roundedClass} group ${posterClasses}`}>
                <img
                    key={itemId || item?.Id}
                    src={
                        posterUrl
                            ? posterUrl
                            : getPrimaryImageUrl(
                                  itemId || item?.Id || '',
                                  undefined,
                                  primaryImageTag
                              )
                    }
                    alt={itemName || item?.Name || ''}
                    className={`${minPosterClasses} ${posterClasses} object-cover ${roundedClass} group-hover:opacity-75 transition-all group-hover:scale-105 transform-gpu will-change-transform z-10`}
                    loading="lazy"
                    onError={() => setPosterFailed(true)}
                />
                <Skeleton className={`absolute bottom-0 left-0 right-0 ${skeletonClasses} -z-1`} />
                <WatchedStateBadge
                    item={item}
                    show={config?.watchedStateBadgeHomeScreen || false}
                />
                {!isArtist && (
                    <div
                        className={`absolute inset-0 ${roundedClass} pointer-events-none poster-card-outline z-20`}
                    />
                )}
            </div>
            <p
                className={`mt-2 text-sm line-clamp-1 text-ellipsis break-all max-w-36 lg:max-w-44 2xl:max-w-52 ${isArtist ? 'text-center w-full' : ''}`}
            >
                {itemName || item?.Name || ''}
            </p>
            {children}
        </Link>
    );
};

export default ScrollableSectionPoster;
