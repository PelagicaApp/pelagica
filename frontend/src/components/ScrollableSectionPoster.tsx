import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Link, useNavigate } from 'react-router';
import { Skeleton } from './ui/skeleton';
import { getPrimaryImageUrl, type ImageSize } from '@/utils/jellyfinUrls';
import { useConfig } from '@/hooks/api/useConfig';
import WatchedStateBadge from './WatchedStateBadge';
import { useState } from 'react';
import { Eye, ImageOff, Play } from 'lucide-react';

interface ScrollableSectionPosterProps {
    item?: BaseItemDto;
    posterUrl?: string;
    children?: React.ReactNode;
    itemName?: string;
    itemId?: string;
    className?: string;
}

const DIRECT_PLAY_ROUTES: Record<string, string> = {
    MusicVideo: '/play',
    Video: '/play',
    Photo: '/photo',
};

const MUSIC_ROUTES: Record<string, string> = {
    MusicAlbum: '/music/album',
    MusicArtist: '/music/artist',
    Playlist: '/music/playlist',
};

function getItemLink(type: string | undefined, id: string | undefined): string {
    if (type && DIRECT_PLAY_ROUTES[type]) return `${DIRECT_PLAY_ROUTES[type]}/${id}`;
    if (type && MUSIC_ROUTES[type]) return `${MUSIC_ROUTES[type]}/${id}`;
    return `/item/${id}`;
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
    const navigate = useNavigate();
    const [posterFailed, setPosterFailed] = useState(false);

    const isArtist = item?.Type === 'MusicArtist';
    const isSquareType = item?.Type === 'Playlist' || item?.Type === 'MusicAlbum' || isArtist;
    const isLandscapeType =
        item?.Type === 'MusicVideo' || item?.Type === 'Video' || item?.Type === 'Photo';
    const isDirectPlay = item?.Type !== undefined && item.Type in DIRECT_PLAY_ROUTES;

    const posterClasses = isLandscapeType
        ? 'w-64 h-36 lg:w-72 lg:h-40 2xl:w-80 2xl:h-45'
        : isSquareType
          ? 'w-36 h-36 lg:w-44 lg:h-44 2xl:w-52 2xl:h-52'
          : 'w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80';
    const minPosterClasses = isLandscapeType
        ? 'min-w-64 lg:min-w-72 2xl:min-w-80 min-h-36 lg:min-h-40 2xl:min-h-45'
        : isSquareType
          ? 'min-w-36 lg:min-w-44 2xl:min-w-52 min-h-36 lg:min-h-44 2xl:min-h-52'
          : 'min-w-36 lg:min-w-44 2xl:min-w-52 min-h-54 lg:min-h-64 2xl:min-h-80';
    const skeletonClasses = isLandscapeType
        ? 'h-36 lg:h-40 2xl:h-45'
        : isSquareType
          ? 'h-36 lg:h-44 2xl:h-52'
          : 'h-54 lg:h-64 2xl:h-80';
    const maxTextWidth = isLandscapeType
        ? 'max-w-64 lg:max-w-72 2xl:max-w-80'
        : 'max-w-36 lg:max-w-44 2xl:max-w-52';
    const roundedClass = isArtist ? 'rounded-full' : 'rounded-md';

    const primaryImageTag = item?.ImageTags?.Primary;

    const posterImageSize: ImageSize = isLandscapeType
        ? { width: 640, height: 360 }
        : isSquareType
          ? { width: 300, height: 300 }
          : { width: 300, height: 450 };

    const id = itemId || item?.Id;
    const linkTo = getItemLink(item?.Type, id);

    const watched = item?.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = item?.RunTimeTicks ?? 0;
    const progress = isDirectPlay
        ? item?.UserData?.Played && watched <= 0
            ? 100
            : runtime > 0
              ? (watched / runtime) * 100
              : 0
        : 0;

    const PlayIcon = item?.Type === 'Photo' ? Eye : Play;
    const playIconClass =
        item?.Type === 'Photo' ? 'w-5 h-5 text-white' : 'w-5 h-5 text-white fill-white';

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
                <p className={`mt-2 text-sm line-clamp-1 text-ellipsis break-all ${maxTextWidth}`}>
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
                                  posterImageSize,
                                  primaryImageTag
                              )
                    }
                    alt={itemName || item?.Name || ''}
                    className={`${minPosterClasses} ${posterClasses} object-cover ${roundedClass} group-hover:opacity-75 transition-all group-hover:scale-105 transform-gpu will-change-transform z-10`}
                    loading="lazy"
                    onError={() => setPosterFailed(true)}
                />
                <Skeleton className={`absolute bottom-0 left-0 right-0 ${skeletonClasses} -z-1`} />
                {isDirectPlay && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <div
                            className="bg-black/60 rounded-full p-3 cursor-pointer hover:bg-black/75"
                            role="button"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(linkTo);
                            }}
                        >
                            <PlayIcon className={playIconClass} />
                        </div>
                    </div>
                )}
                <WatchedStateBadge
                    item={item}
                    show={config?.watchedStateBadgeHomeScreen || false}
                />
                {!isArtist && (
                    <div
                        className={`absolute inset-0 ${roundedClass} pointer-events-none poster-card-outline z-20`}
                    />
                )}
                {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                        <div
                            style={{ width: `${progress}%` }}
                            className="h-full bg-brand transition-[width]"
                        />
                    </div>
                )}
            </div>
            <p
                className={`mt-2 text-sm line-clamp-1 text-ellipsis break-all ${maxTextWidth} ${isArtist ? 'text-center w-full' : ''}`}
            >
                {itemName || item?.Name || ''}
            </p>
            {children}
        </Link>
    );
};

export default ScrollableSectionPoster;
