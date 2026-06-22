import SectionScroller from '@/components/SectionScroller';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { EpisodeDisplay } from '@/hooks/api/useConfig';
import { useEpisodes } from '@/hooks/api/useEpisodes';
import { getPrimaryImageUrl, getThumbUrl } from '@/utils/jellyfinUrls';
import { ticksToReadableTime } from '@/utils/timeConversion';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ImageOff, Play, Star } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { buildPlayerUrl } from '@/utils/playerUrl';

const EpisodeComponent = memo(
    ({
        episode,
        navigate,
        className,
        backUrl,
    }: {
        episode: BaseItemDto;
        navigate: ReturnType<typeof useNavigate>;
        className?: string;
        backUrl: string;
    }) => {
        const { t } = useTranslation('item');
        const [imageError, setImageError] = useState(false);

        const watched = episode.UserData?.PlaybackPositionTicks ?? 0;
        const runtime = episode.RunTimeTicks ?? 0;
        const progress =
            episode.UserData?.Played && watched <= 0
                ? 100
                : runtime > 0
                  ? (watched / runtime) * 100
                  : 0;

        console.log('Image tags: ', episode.ImageTags);

        return (
            <Link to={`/item/${episode.Id}`} key={episode.Id} className={'group ' + className}>
                <div className="relative w-full aspect-video rounded-md overflow-hidden">
                    {imageError ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                            <ImageOff className="w-12 h-12 text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={
                                    episode.SeriesId
                                        ? getPrimaryImageUrl(
                                              episode.Id!,
                                              {
                                                  width: 416,
                                              },
                                              episode.ImageTags?.Primary
                                          )
                                        : getThumbUrl(
                                              episode.Id!,
                                              {
                                                  width: 416,
                                              },
                                              episode.ImageTags?.Thumb
                                          )
                                }
                                alt={episode.Name || t('no_title')}
                                className="w-full h-full object-cover rounded-md group-hover:opacity-75 group-hover:scale-105 transition-opacity transition-transform duration-300 ease-out will-change-transform"
                                onError={() => setImageError(true)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div
                                    className="bg-black/60 rounded-full p-4 cursor-pointer hover:bg-black/75"
                                    role="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(buildPlayerUrl(episode.Id!, backUrl));
                                    }}
                                >
                                    <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                            </div>
                            {episode.RunTimeTicks && (
                                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                                    {ticksToReadableTime(episode.RunTimeTicks)}
                                </Badge>
                            )}
                            <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                        </div>
                    )}
                    {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                            <div
                                style={{ width: `${progress}%` }}
                                className="h-full bg-brand transition-width"
                            />
                        </div>
                    )}
                </div>
                <p className="mt-2 text-md line-clamp-1 text-ellipsis break-all">
                    {episode.Name || t('no_title')}
                </p>
                <p className="mt-1 text-sm line-clamp-2 text-ellipsis text-muted-foreground">
                    {episode.Overview}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {episode.IndexNumber !== undefined && (
                        <Badge variant={'outline'}>
                            S{episode.ParentIndexNumber} E{episode.IndexNumber}
                        </Badge>
                    )}
                    {episode.CommunityRating !== undefined && (
                        <Badge variant={'outline'}>
                            <Star size={14} />
                            {episode.CommunityRating?.toFixed(1)}
                        </Badge>
                    )}
                    {episode.PremiereDate && (
                        <Badge variant={'outline'}>
                            {new Date(episode.PremiereDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Badge>
                    )}
                </div>
            </Link>
        );
    }
);

EpisodeComponent.displayName = 'EpisodeComponent';

const EpisodesGrid = memo(
    ({
        seriesId,
        seasonId,
        title,
        seasonsLoading,
    }: {
        seriesId: string | null;
        seasonId: string;
        title?: React.ReactNode;
        seasonsLoading?: boolean;
    }) => {
        const navigate = useNavigate();
        const location = useLocation();
        const { data: episodes, isLoading, error } = useEpisodes(seriesId, seasonId);

        if (isLoading || seasonsLoading) {
            return (
                <div className="flex flex-col gap-4">
                    {title}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 12 }, (_, i) => (
                            <div key={i} className="group animate-pulse">
                                <Skeleton className="w-full aspect-video rounded-md" />
                                <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (error) {
            return <p>Error loading episodes: {(error as Error).message}</p>;
        }

        return (
            <div className="flex flex-col gap-4">
                {title}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {episodes?.map((item) => (
                        <EpisodeComponent
                            key={item.Id}
                            episode={item}
                            navigate={navigate}
                            backUrl={location.pathname + location.search}
                        />
                    ))}
                </div>
            </div>
        );
    }
);

EpisodesGrid.displayName = 'EpisodesGrid';

const EpisodesRow = memo(
    ({
        seriesId,
        seasonId,
        title,
        seasonsLoading,
    }: {
        seriesId: string | null;
        seasonId: string;
        title?: React.ReactNode;
        seasonsLoading?: boolean;
    }) => {
        const navigate = useNavigate();
        const location = useLocation();
        const { data: episodes, isLoading, error } = useEpisodes(seriesId, seasonId);

        if (isLoading || seasonsLoading) {
            return (
                <SectionScroller
                    title={title}
                    items={Array.from({ length: 10 }, (_, i) => (
                        <div
                            key={i}
                            className="group min-w-48 lg:min-w-64 2xl:min-w-80 animate-pulse"
                        >
                            <Skeleton className="w-full aspect-video rounded-md" />
                            <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
                        </div>
                    ))}
                />
            );
        }

        if (error) {
            return <p>Error loading episodes: {(error as Error).message}</p>;
        }

        return (
            <SectionScroller
                title={title}
                items={
                    episodes?.map((item) => (
                        <EpisodeComponent
                            key={item.Id}
                            episode={item}
                            navigate={navigate}
                            backUrl={location.pathname + location.search}
                            className="w-min min-w-48 lg:min-w-64 2xl:min-w-80"
                        />
                    )) || []
                }
            />
        );
    }
);

EpisodesRow.displayName = 'EpisodesRow';

const EpisodesDisplay = ({
    seriesId,
    seasonId,
    title,
    seasonsLoading,
    episodeDisplay,
}: {
    seriesId: string | null;
    seasonId: string;
    title?: React.ReactNode;
    seasonsLoading?: boolean;
    episodeDisplay: EpisodeDisplay;
}) => {
    if (episodeDisplay === 'grid')
        return (
            <EpisodesGrid
                seasonId={seasonId}
                seriesId={seriesId}
                title={title}
                seasonsLoading={seasonsLoading}
            />
        );
    else
        return (
            <EpisodesRow
                seasonId={seasonId}
                seriesId={seriesId}
                title={title}
                seasonsLoading={seasonsLoading}
            />
        );
};

export default EpisodesDisplay;
