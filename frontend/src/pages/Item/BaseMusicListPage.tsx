import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { getItemUrl } from '@/utils/itemUrl';
import { usePageBackground } from '@/hooks/usePageBackground';
import { Link } from 'react-router';
import { ticksToReadableTime } from '@/utils/timeConversion';
import { Button } from '@/components/ui/button';
import { EllipsisVertical, ImageOff, Info, Play } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import { Skeleton } from '@/components/ui/skeleton';
import type { AppConfig } from '@/hooks/api/useConfig';
import { useAlbumTracks } from '@/hooks/api/useAlbumTracks';
import { usePlaylistItems } from '@/hooks/api/playlist/usePlaylistItems';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { useTranslation } from 'react-i18next';
import { getUserId } from '@/utils/localstorageCredentials';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MediaInfoDialog from '../../components/MediaInfoDialog';
import { useState, useEffect, useMemo } from 'react';
import ItemAdminButton from '@/components/ItemAdminButton';
import MusicAlbumTrackRow from '@/components/MusicAlbumTrackRow';
import MusicItemContextMenu from '@/components/MusicItemContextMenu';
import { toPlaybackTracks } from '@/utils/musicPlaybackTrack';

const MAX_ARTISTS_DISPLAYED = 5;

const TrackMediaInfoButton = ({ track, t }: { track: BaseItemDto; t: (key: string) => string }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant={'outline'} size={'icon-sm'} onClick={(e) => e.stopPropagation()}>
                <EllipsisVertical />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <MediaInfoDialog
                streams={track.MediaStreams || []}
                path={track.Path}
                trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Info /> {t('mediaInfo')}
                    </DropdownMenuItem>
                }
            />
        </DropdownMenuContent>
    </DropdownMenu>
);

interface BaseMusicListPageProps {
    item: BaseItemDto;
    config: AppConfig;
    listType: string;
    showBackground?: boolean;
}

const BaseMusicListPage = ({
    item,
    config,
    listType,
    showBackground = true,
}: BaseMusicListPageProps) => {
    const { t } = useTranslation('item');
    const { setBackground } = usePageBackground();
    const { loadQueue } = useMusicPlayback();
    const isPlaylist = item.Type === 'Playlist';
    const userId = getUserId() || undefined;
    const {
        data: albumTracksData,
        isLoading: isLoadingAlbumTracksData,
        error: albumTracksDataError,
    } = useAlbumTracks(isPlaylist ? undefined : item.Id);
    const {
        data: playlistTracksData,
        isLoading: isLoadingPlaylistTracksData,
        error: playlistTracksDataError,
    } = usePlaylistItems(isPlaylist ? item.Id : undefined, userId);
    const albumTracks = isPlaylist ? playlistTracksData : albumTracksData;
    const isLoadingAlbumTracks = isPlaylist
        ? isLoadingPlaylistTracksData
        : isLoadingAlbumTracksData;
    const albumTracksError = isPlaylist ? playlistTracksDataError : albumTracksDataError;
    const [failedCover, setFailedCover] = useState(false);

    const playbackTracks = useMemo(
        () => (albumTracks ? toPlaybackTracks(albumTracks, item) : []),
        [albumTracks, item]
    );

    useEffect(() => {
        if (!showBackground) return;
        setBackground(
            <div className="fixed top-0 left-0 w-full h-full -z-20 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={getPrimaryImageUrl(item.Id || '', undefined, item.ImageTags?.Primary)}
                        alt={item.Name + ' Backdrop'}
                        className="w-full h-full object-cover blur-3xl scale-110 opacity-40"
                        onError={() => setFailedCover(true)}
                    />
                </div>
                <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/50 to-background" />
                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
            </div>
        );

        return () => {
            setBackground(null);
        };
    }, [item.Id, item.Name, item.ImageTags, setBackground, showBackground]);

    const detailItems: string[] = [];
    if (item.PremiereDate) {
        const year = new Date(item.PremiereDate).getFullYear();
        detailItems.push(year.toString());
    }
    if (item.ChildCount !== undefined && item.ChildCount !== null) {
        detailItems.push(
            t(`tracks_count${item.ChildCount > 1 ? '_plural' : ''}`, { count: item.ChildCount })
        );
    }
    if (item.RunTimeTicks !== undefined && item.RunTimeTicks !== null) {
        detailItems.push(ticksToReadableTime(item.RunTimeTicks));
    }

    const handlePlayAlbum = () => {
        if (playbackTracks.length > 0) {
            loadQueue(playbackTracks, 0, true);
        }
    };

    const handleTrackPlay = (index: number) => {
        if (playbackTracks.length > 0) {
            loadQueue(playbackTracks, index, true);
        }
    };

    const header = (
        <div className="flex flex-col gap-4">
            <div className="flex justify-start items-end-safe gap-4 w-full">
                {!failedCover ? (
                    <div className="relative">
                        <img
                            src={getPrimaryImageUrl(
                                item.Id!,
                                { width: 300, height: 300 },
                                item.ImageTags?.Primary
                            )}
                            alt={item.Name + ' Cover'}
                            className="relative w-32 h-32 object-contain rounded-md"
                            onError={() => setFailedCover(true)}
                        />
                        <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                    </div>
                ) : (
                    <div className="relative w-32 h-32 bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="text-muted-foreground" size={32} />
                    </div>
                )}
                <div className="flex flex-col gap-0">
                    <span className="text-sm text-muted-foreground">{listType}</span>
                    <h1 className="text-3xl font-bold">{item.Name}</h1>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {item.ArtistItems &&
                            item.ArtistItems.slice(0, MAX_ARTISTS_DISPLAYED).map((artist) => (
                                <Link
                                    key={artist.Id}
                                    to={getItemUrl('MusicArtist', artist.Id)}
                                    className="bg-accent/20 rounded-full text-sm"
                                >
                                    {artist.Name}
                                </Link>
                            ))}
                        {item.ArtistItems && item.ArtistItems.length > MAX_ARTISTS_DISPLAYED && (
                            <span className="text-sm text-muted-foreground">
                                {t('more_artists', {
                                    count: item.ArtistItems.length - MAX_ARTISTS_DISPLAYED,
                                })}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                        {detailItems.join(' • ')}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button onClick={handlePlayAlbum}>
                    <Play />
                    {t('play')}
                </Button>
                <FavoriteButton
                    item={item}
                    size={'icon'}
                    showFavoriteButton={config.itemPage?.favoriteButton?.includes(item.Type!)}
                />
                <ItemAdminButton item={item} />
            </div>
        </div>
    );

    return (
        <div className="relative h-full w-full">
            <div className={`relative z-10`}>
                <div
                    className={`bg-background/30 backdrop-blur-md p-3 rounded-md w-full flex flex-col gap-4`}
                >
                    <MusicItemContextMenu item={item}>{header}</MusicItemContextMenu>
                    {isLoadingAlbumTracks && (
                        <div className="flex flex-col gap-0">
                            <div className="flex items-center p-2 px-8 group text-muted-foreground">
                                <span className="text-sm mr-8 font-mono w-4">#</span>
                                <span>{t('title')}</span>
                                <span className="text-sm ml-auto">{t('duration')}</span>
                            </div>
                            <div className="border-b border-border mb-4" />
                            <div className="flex flex-col gap-3">
                                {[...Array(3)].map((_, index) => (
                                    <Skeleton key={index} className="h-15 w-full rounded-xl" />
                                ))}
                            </div>
                        </div>
                    )}
                    {albumTracksError && (
                        <div className="text-red-500">{t('error_loading_tracks')}</div>
                    )}
                    {albumTracks && albumTracks.length > 0 && (
                        <div className="flex flex-col gap-0">
                            <div className="flex items-center p-2 px-8 group text-muted-foreground">
                                <span className="text-sm mr-8 font-mono w-4">#</span>
                                <span>{t('title')}</span>
                                <span className="text-sm ml-auto">{t('duration')}</span>
                                <Button variant="ghost" size="icon-sm" className="ml-4 invisible">
                                    <EllipsisVertical />
                                </Button>
                            </div>
                            <div className="border-b border-border mb-4" />
                            <div className="flex flex-col gap-1">
                                {albumTracks.map((track, index) => {
                                    if (!isPlaylist && !track.IndexNumber) return null;

                                    return (
                                        <MusicAlbumTrackRow
                                            key={track.Id}
                                            track={track}
                                            index={index}
                                            displayIndex={isPlaylist ? index + 1 : undefined}
                                            contextTracks={playbackTracks}
                                            onPlay={() => handleTrackPlay(index)}
                                            trailing={<TrackMediaInfoButton track={track} t={t} />}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BaseMusicListPage;
