import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getContinueWatchingImageUrls, ticksToReadableTime } from '@pelagica/core';
import { Check, ImageOff, Play } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import GeneralItemContextMenu from '@/components/GeneraItemContextMenu';
import { getItemUrl } from '@/utils/itemUrl';
import { buildPlayerUrl } from '@/utils/playerUrl';

interface PlaylistEntryRowProps {
    entry: BaseItemDto;
    index: number;
    detail?: string;
    backUrl: string;
    playable: boolean;
}

const PlaylistEntryRow = memo(
    ({ entry, index, detail, backUrl, playable }: PlaylistEntryRowProps) => {
        const { t } = useTranslation('item');
        const navigate = useNavigate();
        const [imageIndex, setImageIndex] = useState(0);
        const imageSrc = getContinueWatchingImageUrls(entry, false, { width: 416 })[imageIndex];

        const watched = entry.UserData?.PlaybackPositionTicks ?? 0;
        const runtime = entry.RunTimeTicks ?? 0;
        const played = !!entry.UserData?.Played;
        const progress = played ? 100 : runtime > 0 ? (watched / runtime) * 100 : 0;

        const playLink = playable ? buildPlayerUrl(entry.Id!, backUrl) : undefined;

        return (
            <GeneralItemContextMenu item={entry} playLink={playLink}>
                <Link
                    to={getItemUrl(entry.Type, entry.Id, entry.MediaType)}
                    className="group flex items-center gap-3 sm:gap-4 rounded-lg p-2 -mx-2 hover:bg-white/5 transition-colors"
                >
                    <span className="hidden sm:block w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                        {index + 1}
                    </span>

                    <div className="relative w-32 sm:w-44 lg:w-52 shrink-0 aspect-video rounded-md overflow-hidden bg-muted">
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt={entry.Name || t('no_title')}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                                onError={() => setImageIndex((i) => i + 1)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageOff className="w-8 h-8 text-muted-foreground" />
                            </div>
                        )}
                        {played && (
                            <span className="absolute top-1.5 right-1.5 bg-brand text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center z-20">
                                <Check className="w-3 h-3" />
                            </span>
                        )}
                        {playLink && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div
                                    className="bg-black/60 rounded-full p-3 cursor-pointer hover:bg-black/75"
                                    role="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(playLink);
                                    }}
                                >
                                    <Play className="w-5 h-5 text-white fill-white" />
                                </div>
                            </div>
                        )}
                        {progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                <div
                                    style={{ width: `${progress}%` }}
                                    className="h-full bg-brand"
                                />
                            </div>
                        )}
                        <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <p className="font-medium line-clamp-1">{entry.Name || t('no_title')}</p>
                        {detail && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{detail}</p>
                        )}
                        {entry.Overview && (
                            <div className="hidden md:block mt-1">
                                <p className="text-sm text-muted-foreground/80 line-clamp-2">
                                    {entry.Overview.replace(/<br\s*\/?>/gi, ' ')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-2">
                        {runtime > 0 && (
                            <span className="hidden sm:block text-sm tabular-nums text-muted-foreground">
                                {ticksToReadableTime(runtime)}
                            </span>
                        )}
                    </div>
                </Link>
            </GeneralItemContextMenu>
        );
    }
);

PlaylistEntryRow.displayName = 'PlaylistEntryRow';

export const PlaylistEntryRowSkeleton = () => (
    <div className="flex items-center gap-3 sm:gap-4 p-2 -mx-2">
        <span className="hidden sm:block w-6 shrink-0" />
        <Skeleton className="w-32 sm:w-44 lg:w-52 shrink-0 aspect-video rounded-md" />
        <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-3 w-1/5 rounded-md" />
        </div>
    </div>
);

export default PlaylistEntryRow;
