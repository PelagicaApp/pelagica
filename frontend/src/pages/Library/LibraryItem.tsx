import { Skeleton } from '@/components/ui/skeleton';
import { useConfig } from '@/hooks/api/useConfig';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { TFunction } from 'i18next';
import { ImageOff, Play } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { buildPlayerUrl } from '@/utils/playerUrl';
import WatchedStateBadge from '@/components/WatchedStateBadge';

const LibraryItem = ({
    item,
    posterUrl,
    t,
    posterAspectRatio = '2/3',
    detailLine,
    isDirectPlay,
    itemLink,
}: {
    item: BaseItemDto;
    posterUrl: string;
    t: TFunction;
    posterAspectRatio?: string;
    detailLine?: React.ReactNode;
    isDirectPlay?: boolean;
    itemLink?: string;
}) => {
    const { config } = useConfig();
    const navigate = useNavigate();
    const location = useLocation();
    const [posterError, setPosterError] = useState(false);

    const playUrl = buildPlayerUrl(item.Id!, location.pathname + location.search);
    const itemPath = itemLink || (isDirectPlay ? playUrl : `/item/${item.Id}`);

    const watched = item.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = item.RunTimeTicks ?? 0;
    const progress = isDirectPlay
        ? item.UserData?.Played && watched <= 0
            ? 100
            : runtime > 0
              ? (watched / runtime) * 100
              : 0
        : 0;
    
    return (
        <Link to={itemPath} key={item.Id} className="p-0 m-0">
            <div
                className={`relative w-full aspect-${posterAspectRatio} overflow-hidden rounded-md group`}
            >
                {!posterError ? (
                    <>
                        <img
                            key={item.Id}
                            src={posterUrl}
                            alt={item.Name || t('library:no_title')}
                            className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105 z-10"
                            loading="lazy"
                            onError={() => setPosterError(true)}
                        />
                        <Skeleton className="absolute bottom-0 left-0 right-0 top-0 -z-1" />
                        {isDirectPlay && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <div
                                    className="bg-black/60 rounded-full p-4 cursor-pointer hover:bg-black/75"
                                    role="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(itemLink || playUrl);
                                    }}
                                >
                                    <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                    </>
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="text-4xl text-muted-foreground" />
                    </div>
                )}
                <WatchedStateBadge item={item} show={config?.watchedStateBadgeLibrary || false} />
                {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                        <div
                            style={{ width: `${progress}%` }}
                            className="h-full bg-brand transition-[width]"
                        />
                    </div>
                )}
            </div>
            <p className="mt-2 text-sm line-clamp-1 text-ellipsis break-all">
                {item.Name || t('library:no_title')}
            </p>
            <div className="flex flex-wrap items-center">
                <span className="text-xs text-muted-foreground mr-3 line-clamp-1">
                    {detailLine}
                </span>
            </div>
        </Link>
    );
};

export default LibraryItem;