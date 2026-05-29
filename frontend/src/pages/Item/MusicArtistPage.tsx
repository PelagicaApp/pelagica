import { useEffect, useMemo, useState } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Mic2, Play } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { AppConfig } from '@/hooks/api/useConfig';
import {
    useArtistAlbumCount,
    useArtistItems,
    useArtistTracks,
} from '@/hooks/api/useArtistItems';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { usePageBackground } from '@/hooks/usePageBackground';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import FavoriteButton from '@/components/FavoriteButton';
import ItemAdminButton from '@/components/ItemAdminButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ItemsListPage from './ItemsListPage';

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
    const { setBackground } = usePageBackground();
    const [imageError, setImageError] = useState(false);

    const { data: albumCount, isLoading: loadingAlbumCount } = useArtistAlbumCount(item.Id);
    const { data: tracks, isLoading: loadingTracks } = useArtistTracks(item.Id);

    const posterUrl = getPrimaryImageUrl(item.Id || '', { width: 512, height: 512 }, item.ImageTags?.Primary);

    useEffect(() => {
        if (imageError) {
            setBackground(null);
            return;
        }

        setBackground(
            <div className="fixed top-0 left-0 w-full h-full -z-20 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={posterUrl}
                        alt=""
                        className="h-full w-full scale-110 object-cover opacity-35 blur-3xl"
                    />
                </div>
                <div className="absolute inset-0 bg-linear-to-b from-background/70 via-background/85 to-background" />
            </div>
        );

        return () => setBackground(null);
    }, [posterUrl, imageError, setBackground]);

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
            tracks.map((track) => ({
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

    return (
        <div className="flex flex-col gap-10">
            <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/40 p-6 shadow-xl backdrop-blur-md sm:p-8 md:h-80 lg:h-96">
                <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-primary/5 blur-3xl" />

                <div className="relative flex flex-col gap-8 md:h-full md:flex-row md:items-stretch md:gap-8">
                    <div className="mx-auto flex shrink-0 items-center justify-center md:mx-0 md:h-full md:py-1">
                        {!imageError ? (
                            <div className="relative aspect-square h-40 sm:h-52 md:h-full md:max-h-full">
                                <img
                                    src={posterUrl}
                                    alt={item.Name || t('no_title')}
                                    className="size-full rounded-full object-cover shadow-2xl ring-4 ring-background/80"
                                    onError={() => setImageError(true)}
                                />
                                <Skeleton className="absolute inset-0 -z-10 size-full rounded-full" />
                            </div>
                        ) : (
                            <div className="flex aspect-square h-40 items-center justify-center rounded-full bg-muted shadow-2xl ring-4 ring-background/80 sm:h-52 md:h-full md:max-h-full">
                                {item.Name ? (
                                    <span className="text-4xl font-bold text-muted-foreground sm:text-5xl">
                                        {getArtistInitials(item.Name)}
                                    </span>
                                ) : (
                                    <Mic2 className="size-12 text-muted-foreground" />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col text-center md:h-full md:text-left">
                        <div className="shrink-0">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                                {t('artist')}
                            </p>
                            <h1 className="mt-2 line-clamp-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                {item.Name}
                            </h1>

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                {loadingAlbumCount ? (
                                    <Skeleton className="h-7 w-24 rounded-full" />
                                ) : (
                                    albumCountLabel && (
                                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                                            {albumCountLabel}
                                        </Badge>
                                    )
                                )}
                                {genreItems.map((genre) =>
                                    genre.id ? (
                                        <Badge
                                            key={genre.id}
                                            variant="outline"
                                            className="rounded-full"
                                            asChild
                                        >
                                            <Link to={`/item/${genre.id}`}>{genre.name}</Link>
                                        </Badge>
                                    ) : (
                                        <Badge
                                            key={genre.name}
                                            variant="outline"
                                            className="rounded-full"
                                        >
                                            {genre.name}
                                        </Badge>
                                    )
                                )}
                            </div>
                        </div>

                        {item.Overview && (
                            <div className="mt-4 min-h-0 flex-1 md:overflow-y-auto md:overscroll-contain md:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base md:text-left">
                                    {item.Overview}
                                </p>
                            </div>
                        )}

                        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-center gap-2 md:mt-auto md:justify-start md:pt-4">
                            <Button
                                size="lg"
                                className="rounded-full px-6"
                                onClick={handlePlayArtist}
                                disabled={loadingTracks || !tracks?.length}
                            >
                                <Play className="fill-current" />
                                {t('play')}
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
                </div>
            </section>

            <section>
                <ItemsListPage
                    item={item}
                    useItems={useArtistItems}
                    itemAspectClass="aspect-square"
                    listTitle={t('albums')}
                />
            </section>
        </div>
    );
};

export default MusicArtistPage;
