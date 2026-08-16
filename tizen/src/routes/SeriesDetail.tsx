import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import {
    getPrimaryImageUrl,
    getUserId,
    useEpisodes,
    useItem,
    useSeasons,
    useSimilarItems,
} from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ImageOff, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_RING_LARGE } from '@/lib/focus-styles';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { Badge } from '@/components/ui/badge';
import { formatRuntime } from '@/lib/formatRuntime';
import ItemHero from '../components/ItemHero';
import FocusableButton from '../components/FocusableButton';
import PlayButton from '../components/PlayButton';
import WatchlistButton from '../components/WatchlistButton';
import FavoriteButton from '../components/FavoriteButton';
import ItemRow from '../components/ItemRow';
import { Skeleton } from '../components/ui/skeleton';
import TrailerButton from '../components/TrailerButton';
import { buildPlayerUrl } from '@/lib/playerUrl';

const EpisodeCard = ({ episode, autoFocus }: { episode: BaseItemDto; autoFocus?: boolean }) => {
    const [imageError, setImageError] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation('item');
    const { ref, focused, focusSelf } = useFocusable<object, HTMLButtonElement>({
        onEnterPress: () => ref.current?.click(),
    });

    useEffect(() => {
        if (autoFocus) focusSelf();
    }, [autoFocus, focusSelf]);

    useScrollIntoViewOnFocus(ref, focused);

    const watched = episode.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = episode.RunTimeTicks ?? 0;
    const progress =
        episode.UserData?.Played && watched <= 0
            ? 100
            : runtime > 0
              ? (watched / runtime) * 100
              : 0;

    return (
        <button
            ref={ref}
            onClick={() =>
                episode &&
                episode.Id &&
                navigate(buildPlayerUrl(episode.Id, location.pathname + location.search))
            }
            type="button"
            className="w-64 shrink-0 scroll-m-6 text-left outline-none"
        >
            <div
                className={cn(
                    'relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted',
                    focused && FOCUS_RING_LARGE
                )}
            >
                {imageError || !episode.Id ? (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                    </div>
                ) : (
                    <img
                        src={getPrimaryImageUrl(
                            episode.Id,
                            { width: 400 },
                            episode.ImageTags?.Primary
                        )}
                        alt={episode.Name || t('unknown_episode')}
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                    />
                )}
                {episode.RunTimeTicks && (
                    <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                        {formatRuntime(episode.RunTimeTicks)}
                    </Badge>
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
            <p className="mt-2 truncate text-sm font-medium">
                {episode.IndexNumber != null ? `${episode.IndexNumber}. ` : ''}
                {episode.Name}
            </p>
            {episode.Overview && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {episode.Overview}
                </p>
            )}
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
        </button>
    );
};

const EpisodeCardSkeleton = () => (
    <div className="w-64 shrink-0">
        <Skeleton className="aspect-video w-full rounded-md" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <div className="mt-1 flex flex-col gap-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
        </div>
    </div>
);

const EpisodeRow = ({ episodes, isLoading }: { episodes: BaseItemDto[]; isLoading: boolean }) => {
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
        focusable: !isLoading && episodes.length > 0,
        saveLastFocusedChild: true,
    });

    return (
        <FocusContext.Provider value={focusKey}>
            <div className="scrollbar-hide flex gap-4 overflow-x-auto p-3" ref={ref}>
                {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <EpisodeCardSkeleton key={i} />)
                    : episodes?.map((episode) => (
                          <EpisodeCard key={episode.Id} episode={episode} />
                      ))}
            </div>
        </FocusContext.Provider>
    );
};

const SeasonsRow = ({
    seasons,
    isLoading,
    selectedSeasonId,
    onSelectSeason,
}: {
    seasons: BaseItemDto[];
    isLoading: boolean;
    selectedSeasonId?: string;
    onSelectSeason: (seasonId: string | undefined) => void;
}) => {
    const { t } = useTranslation('item');
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
        focusable: !isLoading && seasons.length > 1,
        saveLastFocusedChild: true,
    });

    if (!isLoading && seasons.length <= 1) return null;

    return (
        <FocusContext.Provider value={focusKey}>
            <div className="flex flex-wrap gap-2" ref={ref}>
                {isLoading ? (
                    <>
                        <Skeleton className="h-9 w-20 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-9 w-20 rounded-md" />
                    </>
                ) : (
                    seasons!.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {seasons!.map((season) => (
                                <FocusableButton
                                    key={season.Id}
                                    variant={season.Id === selectedSeasonId ? 'default' : 'outline'}
                                    onClick={() => onSelectSeason(season.Id ?? undefined)}
                                    className="scroll-m-3 scroll-mb-80"
                                >
                                    {season.Name || t('season_x', { number: season.IndexNumber })}
                                </FocusableButton>
                            ))}
                        </div>
                    )
                )}
            </div>
        </FocusContext.Provider>
    );
};

const SeriesDetail = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const { t } = useTranslation(['item', 'common']);
    const { data: item, isLoading } = useItem(itemId, true, getUserId() ?? undefined);
    const { data: similarItems, isLoading: isSimilarItemsLoading } = useSimilarItems(itemId, 12);

    const { data: seasons, isLoading: isSeasonsLoading } = useSeasons(itemId);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);
    const { data: episodes, isLoading: isEpisodesLoading } = useEpisodes(
        itemId ?? null,
        selectedSeasonId
    );

    useEffect(() => {
        setSelectedSeasonId(undefined);
    }, [itemId]);

    useEffect(() => {
        if (!selectedSeasonId && seasons && seasons.length > 0) {
            setSelectedSeasonId(seasons[0].Id ?? undefined);
        }
    }, [seasons, selectedSeasonId]);

    return (
        <div className="flex flex-col gap-6">
            <ItemHero
                item={item}
                isLoading={isLoading}
                extraBadge={
                    item?.ChildCount && (
                        <Badge variant="outline">
                            {t('common:season_count', { count: item.ChildCount })}
                        </Badge>
                    )
                }
                mainButtonRow={
                    item && (
                        <>
                            <PlayButton item={item} />
                            <TrailerButton item={item} />
                            <WatchlistButton item={item} />
                            <FavoriteButton item={item} />
                        </>
                    )
                }
            />

            {(isSeasonsLoading || (seasons && seasons.length > 0)) && (
                <div className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold">{t('episodes')}</h2>

                    <SeasonsRow
                        onSelectSeason={setSelectedSeasonId}
                        seasons={seasons ?? []}
                        isLoading={isSeasonsLoading}
                        selectedSeasonId={selectedSeasonId}
                    />

                    <EpisodeRow
                        episodes={episodes ?? []}
                        isLoading={isEpisodesLoading || isSeasonsLoading}
                    />
                </div>
            )}

            <ItemRow
                title={t('more_like_this')}
                items={similarItems ?? []}
                isLoading={isLoading || isSimilarItemsLoading}
            />
        </div>
    );
};

export default SeriesDetail;
