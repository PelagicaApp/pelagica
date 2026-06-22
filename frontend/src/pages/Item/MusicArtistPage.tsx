import { useMemo, useState } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Mic2, Play } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { AppConfig } from '@/hooks/api/useConfig';
import { useArtistAlbumCount, useArtistItems, useArtistTracks } from '@/hooks/api/useArtistItems';
import { useImagePalette } from '@/hooks/useImagePalette';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { cn } from '@/lib/utils';
import FavoriteButton from '@/components/FavoriteButton';
import ItemAdminButton from '@/components/ItemAdminButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ItemsListPage from '../../components/ItemsListPage';
import MoreLikeThisRow from './MoreLikeThisRow';

interface MusicArtistPageProps {
    item: BaseItemDto;
    config: AppConfig;
}

function getArtistInitials(name?: string | null) {
    if (!name) return '?';
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

const MusicArtistPage = ({ item, config }: MusicArtistPageProps) => {
    const { t } = useTranslation('item');
    const { loadQueue } = useMusicPlayback();
    const [imageError, setImageError] = useState(false);
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

    const { data: albumCount, isLoading: loadingAlbumCount } = useArtistAlbumCount(item.Id);
    const { data: tracks, isLoading: loadingTracks } = useArtistTracks(item.Id);

    const posterUrl = getPrimaryImageUrl(
        item.Id || '',
        { width: 512, height: 512 },
        item.ImageTags?.Primary
    );
    const palette = useImagePalette(posterUrl, !imageError);
    const onPalette = !!palette;

    const genreItems = useMemo(() => {
        if (item.GenreItems?.length) {
            return item.GenreItems.filter((genre) => genre.Name).map((genre) => ({
                id: genre.Id,
                name: genre.Name!,
            }));
        }
        return (item.Genres ?? []).map((name) => ({ id: undefined, name }));
    }, [item.GenreItems, item.Genres]);

    const handlePlayArtist = () => {
        if (!tracks?.length) return;

        loadQueue(
            tracks.map((track: BaseItemDto) => ({
                id: track.Id || '',
                title: track.Name || '',
                artist: item.Name || track.ArtistItems?.[0]?.Name || 'Unknown',
                albumId: track.AlbumId || track.ParentId || '',
                albumName: track.Album || '',
            })),
            0,
            true
        );
    };

    const albumCountLabel =
        albumCount != null
            ? t(albumCount === 1 ? 'album_count' : 'album_count_plural', { count: albumCount })
            : null;

    const badgeClass = onPalette
        ? 'border-white/20 bg-white/15 text-white backdrop-blur-sm hover:bg-white/20'
        : undefined;
    const genreBadgeClass = onPalette
        ? 'border-white/25 bg-white/10 text-white/95 backdrop-blur-sm hover:bg-white/15'
        : undefined;

    return (
        <div className="flex flex-col gap-10">
            <section
                className={cn(
                    'relative overflow-hidden rounded-2xl border shadow-xl md:h-80 lg:h-96',
                    !onPalette && 'border-border/60 bg-background/40 backdrop-blur-md'
                )}
            >
                {onPalette && (
                    <>
                        <div
                            className="absolute inset-0"
                            style={{ background: palette.gradient }}
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 bg-linear-to-r from-black/35 via-black/10 to-black/25" />
                    </>
                )}

                <div className="relative flex flex-col md:h-full md:flex-row">
                    <div className="relative aspect-square h-48 w-full shrink-0 sm:h-56 md:h-full md:w-auto">
                        {!imageError ? (
                            <>
                                <img
                                    src={posterUrl}
                                    alt={item.Name || t('no_title')}
                                    className="size-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                                <Skeleton className="absolute inset-0 -z-10 size-full" />
                                {onPalette && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-10 bg-linear-to-l from-black/30 to-transparent md:block" />
                                )}
                            </>
                        ) : (
                            <div className="flex size-full items-center justify-center bg-muted">
                                {item.Name ? (
                                    <span
                                        className={cn(
                                            'text-4xl font-bold sm:text-5xl',
                                            onPalette ? 'text-white/80' : 'text-muted-foreground'
                                        )}
                                    >
                                        {getArtistInitials(item.Name)}
                                    </span>
                                ) : (
                                    <Mic2
                                        className={cn(
                                            'size-12',
                                            onPalette ? 'text-white/80' : 'text-muted-foreground'
                                        )}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div
                        className={cn(
                            'flex min-h-0 min-w-0 flex-1 flex-col p-6 text-center md:h-full md:p-8 md:text-left pb-2!',
                            onPalette && 'text-white'
                        )}
                    >
                        <div className="shrink-0">
                            <div className="flex items-start justify-between gap-3 md:gap-4">
                                <div className="min-w-0 flex-1 text-center md:text-left">
                                    <p
                                        className={cn(
                                            'text-sm font-medium uppercase tracking-[0.2em]',
                                            onPalette ? 'text-white/75' : 'text-primary'
                                        )}
                                    >
                                        {t('artist')}
                                    </p>
                                    <h1
                                        className={cn(
                                            'mt-2 line-clamp-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl',
                                            onPalette && 'text-white drop-shadow-sm'
                                        )}
                                    >
                                        {item.Name}
                                    </h1>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 self-start">
                                    <Button
                                        size="default"
                                        className={cn(
                                            onPalette && 'bg-white text-black hover:bg-white/90'
                                        )}
                                        onClick={handlePlayArtist}
                                        disabled={loadingTracks || !tracks?.length}
                                    >
                                        <Play className="fill-current" />
                                        <span className="hidden sm:inline">{t('play')}</span>
                                    </Button>
                                    <FavoriteButton
                                        item={item}
                                        size="icon"
                                        showFavoriteButton={config.itemPage?.favoriteButton?.includes(
                                            item.Type!
                                        )}
                                    />
                                    <ItemAdminButton item={item} />
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                {loadingAlbumCount ? (
                                    <Skeleton
                                        className={cn(
                                            'h-7 w-24 rounded-full',
                                            onPalette && 'bg-white/20'
                                        )}
                                    />
                                ) : (
                                    albumCountLabel && (
                                        <Badge
                                            variant="secondary"
                                            className={cn('rounded-full px-3 py-1', badgeClass)}
                                        >
                                            {albumCountLabel}
                                        </Badge>
                                    )
                                )}
                                {genreItems.map((genre) =>
                                    genre.id ? (
                                        <Badge
                                            key={genre.id}
                                            variant="outline"
                                            className={cn('rounded-full', genreBadgeClass)}
                                            asChild
                                        >
                                            <Link to={`/item/${genre.id}`}>{genre.name}</Link>
                                        </Badge>
                                    ) : (
                                        <Badge
                                            key={genre.name}
                                            variant="outline"
                                            className={cn('rounded-full', genreBadgeClass)}
                                        >
                                            {genre.name}
                                        </Badge>
                                    )
                                )}
                            </div>
                        </div>

                        {item.Overview && (
                            <>
                                <div
                                    className={cn(
                                        'mt-4 pb-6 min-h-0 flex-1 md:overflow-y-auto md:overscroll-contain md:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/30',
                                        !isOverviewExpanded && 'line-clamp-3 md:line-clamp-none'
                                    )}
                                    style={{
                                        maskImage: !isOverviewExpanded
                                            ? 'linear-gradient(to bottom, black 85%, transparent 100%)'
                                            : undefined,
                                        WebkitMaskImage: !isOverviewExpanded
                                            ? 'linear-gradient(to bottom, black 85%, transparent 100%)'
                                            : undefined,
                                    }}
                                >
                                    <p
                                        className={cn(
                                            'text-sm leading-relaxed sm:text-base md:text-left',
                                            onPalette ? 'text-white/85' : 'text-muted-foreground'
                                        )}
                                    >
                                        {item.Overview}
                                    </p>
                                </div>
                                {!isOverviewExpanded && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsOverviewExpanded(true)}
                                        className="md:hidden"
                                    >
                                        {t('more')}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section>
                <ItemsListPage
                    item={item}
                    useItems={useArtistItems}
                    itemAspectClass="aspect-square"
                    listTitle={t('albums')}
                    getItemUrl={(album) => `/music/album/${album.Id}`}
                />
            </section>

            <MoreLikeThisRow
                title={<h3 className="text-3xl font-bold">{t('more_like_this')}</h3>}
                itemId={item.Id || ''}
                posterShape="square"
                itemType="MusicArtist"
            />
        </div>
    );
};

export default MusicArtistPage;
