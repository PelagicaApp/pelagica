import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    getBackdropUrl,
    getLogoUrl,
    getPrimaryImageUrl,
    getUserId,
    useEpisodes,
    useFavorite,
    useItem,
    useLike,
    useSeasons,
    useSimilarItems,
} from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Bookmark, Heart, ImageOff, Play, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import FocusableButton from '../components/FocusableButton';
import ItemCard from '../components/ItemCard';

function formatRuntime(ticks: number) {
    const totalMinutes = Math.round(ticks / 600000000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const EpisodeCard = ({ episode, autoFocus }: { episode: BaseItemDto; autoFocus?: boolean }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <FocusableButton
            autoFocus={autoFocus}
            variant="ghost"
            className="h-auto w-64 shrink-0 flex-col items-stretch gap-0 whitespace-normal p-0 text-left"
        >
            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
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
                        alt={episode.Name || 'Episode'}
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                    />
                )}
                {episode.RunTimeTicks && (
                    <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                        {formatRuntime(episode.RunTimeTicks)}
                    </Badge>
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
        </FocusableButton>
    );
};

const ItemDetail = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const [backdropError, setBackdropError] = useState(false);
    const [postersFailed, setPostersFailed] = useState(false);
    const [isPosterLoaded, setIsPosterLoaded] = useState(false);
    const [failedLogo, setFailedLogo] = useState(false);

    const { data: item, isLoading } = useItem(itemId, true, getUserId() ?? undefined);
    const { data: similarItems } = useSimilarItems(itemId, 12);
    const { isFavorite, toggleFavorite, isLoading: isFavoriteLoading } = useFavorite(itemId);
    const { isLiked, toggleLike, isLoading: isLikeLoading } = useLike(itemId);

    const isSeries = item?.Type === 'Series';
    const { data: seasons } = useSeasons(isSeries ? itemId : undefined);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);
    const { data: episodes, isLoading: isEpisodesLoading } = useEpisodes(
        isSeries ? (itemId ?? null) : null,
        selectedSeasonId
    );

    useEffect(() => {
        if (!selectedSeasonId && seasons && seasons.length > 0) {
            setSelectedSeasonId(seasons[0].Id ?? undefined);
        }
    }, [seasons, selectedSeasonId]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="-mx-6 -mt-20 flex flex-col gap-6 rounded-b-xl bg-muted p-6 pt-20 sm:flex-row">
                    <div className="aspect-2/3 w-48 shrink-0 animate-pulse rounded-md bg-background/40" />
                    <div className="flex-1 space-y-3">
                        <div className="h-8 w-2/3 animate-pulse rounded bg-background/40" />
                        <div className="h-4 w-1/3 animate-pulse rounded bg-background/40" />
                        <div className="h-20 w-full animate-pulse rounded bg-background/40" />
                    </div>
                </div>
            </div>
        );
    }

    if (!item) {
        return <p className="text-muted-foreground">Item not found.</p>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="relative -mx-6 -mt-20 overflow-hidden rounded-b-xl">
                <div className="absolute inset-0 bg-muted">
                    {item.Id && !backdropError && (
                        <img
                            src={getBackdropUrl(
                                item.Id,
                                { width: 1280 },
                                item.BackdropImageTags?.[0]
                            )}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={() => setBackdropError(true)}
                        />
                    )}
                    <div className="absolute inset-0 bg-linear-to-r from-background via-background/70 to-transparent" />
                    <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
                </div>

                <div className="relative flex flex-col gap-6 p-6 pt-29 sm:flex-row">
                    <div className="w-48 shrink-0 mx-auto lg:mx-0">
                        <div className="relative aspect-2/3 w-full rounded-xl overflow-hidden shadow-2xl shadow-black/85 border border-white/10 bg-muted flex items-center justify-center">
                            {!postersFailed ? (
                                <>
                                    <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />
                                    <img
                                        src={getPrimaryImageUrl(
                                            item.Id || '',
                                            { width: 640, height: 960 },
                                            item.ImageTags?.Primary
                                        )}
                                        alt={item.Name + ' Primary'}
                                        className={[
                                            'object-cover rounded-xl w-full h-full relative z-10',
                                            'transition-[filter,opacity] duration-700 ease-out',
                                            isPosterLoaded
                                                ? 'blur-0 opacity-100'
                                                : 'blur-md opacity-0',
                                        ].join(' ')}
                                        onLoad={() => setIsPosterLoaded(true)}
                                        onError={() => setPostersFailed(true)}
                                    />
                                </>
                            ) : (
                                <ImageOff className="text-muted-foreground w-12 h-12" />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3">
                        {!failedLogo && item.Id ? (
                            <img
                                src={getLogoUrl(item.Id, { maxHeight: 350 }, item.ImageTags?.Logo)}
                                alt={item.Name || ''}
                                className="h-16 max-w-[85%] object-contain object-left mb-2"
                                onError={() => setFailedLogo(true)}
                            />
                        ) : (
                            <h1 className="text-3xl font-semibold tracking-tight mb-2 text-wrap balance">
                                {item.Name}
                            </h1>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {item.ProductionYear && (
                                <Badge variant="outline">{item.ProductionYear}</Badge>
                            )}
                            {item.CommunityRating && (
                                <Badge variant="outline">
                                    <Star /> {item.CommunityRating.toFixed(1)}
                                </Badge>
                            )}
                            {isSeries
                                ? item.ChildCount && (
                                      <Badge variant="outline">
                                          {item.ChildCount}{' '}
                                          {item.ChildCount === 1 ? 'Season' : 'Seasons'}
                                      </Badge>
                                  )
                                : item.RunTimeTicks && (
                                      <Badge variant="outline">
                                          {formatRuntime(item.RunTimeTicks)}
                                      </Badge>
                                  )}
                            {item.OfficialRating && (
                                <Badge variant="outline">{item.OfficialRating}</Badge>
                            )}
                        </div>

                        {item.Genres && item.Genres.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {item.Genres.join(', ')}
                            </p>
                        )}

                        {item.Overview && (
                            <p className="max-w-3xl whitespace-pre-line text-base text-foreground/90 line-clamp-3">
                                {item.Overview}
                            </p>
                        )}

                        <div className="mt-2 flex gap-3">
                            <FocusableButton autoFocus size="lg">
                                <Play /> Play
                            </FocusableButton>
                            <FocusableButton
                                variant="outline"
                                size="lg"
                                onClick={() => toggleLike(!isLiked)}
                                disabled={isLikeLoading}
                            >
                                <Bookmark className={cn(isLiked && 'fill-current')} />
                                {isLiked ? 'Added to Watchlist' : 'Add to Watchlist'}
                            </FocusableButton>
                            <FocusableButton
                                variant="outline"
                                size="lg"
                                onClick={() => toggleFavorite(!isFavorite)}
                                disabled={isFavoriteLoading}
                            >
                                <Heart className={cn(isFavorite && 'fill-current')} />
                                {isFavorite ? 'Favorited' : 'Favorite'}
                            </FocusableButton>
                        </div>
                    </div>
                </div>
            </div>

            {isSeries && seasons && seasons.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold">Episodes</h2>
                    <div className="flex flex-wrap gap-2">
                        {seasons.map((season) => (
                            <FocusableButton
                                key={season.Id}
                                variant={season.Id === selectedSeasonId ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedSeasonId(season.Id ?? undefined)}
                            >
                                {season.Name || `Season ${season.IndexNumber}`}
                            </FocusableButton>
                        ))}
                    </div>
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto p-3">
                        {isEpisodesLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                  <div key={i} className="w-64 shrink-0 space-y-2">
                                      <div className="aspect-video w-full animate-pulse rounded-md bg-muted" />
                                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                                  </div>
                              ))
                            : episodes?.map((episode) => (
                                  <EpisodeCard key={episode.Id} episode={episode} />
                              ))}
                    </div>
                </div>
            )}

            {similarItems && similarItems.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold">More Like This</h2>
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto p-3">
                        {similarItems.map((similarItem) => (
                            <ItemCard key={similarItem.Id} item={similarItem} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemDetail;
