import { Link } from 'react-router';
import { Heart, ListMusic, Mic2, Disc3, Music } from 'lucide-react';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { usePlaylists } from '@/hooks/api/playlist/usePlaylists';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { useFavoriteArtists, useFavoriteAlbums, useFavoriteSongs } from '@/hooks/api/useMusicItems';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

const SidebarSection = ({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const SidebarItem = ({
    to,
    imageUrl,
    icon,
    name,
    subtitle,
    onClick,
}: {
    to?: string;
    imageUrl?: string;
    icon?: React.ReactNode;
    name: string;
    subtitle?: string;
    onClick?: () => void;
}) => {
    const content = (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors min-w-0">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-8 h-8 rounded object-cover shrink-0"
                    loading="lazy"
                />
            ) : icon ? (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                    {icon}
                </div>
            ) : null}
            <div className="flex flex-col min-w-0">
                <span className="text-sm truncate">{name}</span>
                {subtitle && (
                    <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
                )}
            </div>
        </div>
    );

    if (onClick) {
        return <div onClick={onClick}>{content}</div>;
    }

    if (to) {
        return <Link to={to}>{content}</Link>;
    }

    return content;
};

const FavoriteSongItem = ({ song }: { song: BaseItemDto }) => {
    const { loadQueue } = useMusicPlayback();

    return (
        <SidebarItem
            icon={<Music className="w-4 h-4 text-muted-foreground" />}
            imageUrl={
                song.AlbumId
                    ? getPrimaryImageUrl(song.AlbumId, { width: 64, height: 64 })
                    : undefined
            }
            name={song.Name || 'Unknown'}
            subtitle={song.ArtistItems?.[0]?.Name || undefined}
            onClick={() => {
                loadQueue(
                    [
                        {
                            id: song.Id || '',
                            title: song.Name || '',
                            artist: song.ArtistItems?.[0]?.Name || 'Unknown',
                            albumId: song.AlbumId || '',
                            albumName: song.Album || '',
                        },
                    ],
                    0,
                    true
                );
            }}
        />
    );
};

const MusicLeftSidebar = () => {
    const { t } = useTranslation('music');
    const { data: currentUser } = useCurrentUser();
    const { data: playlists, isLoading: isLoadingPlaylists } = usePlaylists(currentUser?.Id);
    const { data: favoriteArtists, isLoading: isLoadingArtists } = useFavoriteArtists();
    const { data: favoriteAlbums, isLoading: isLoadingAlbums } = useFavoriteAlbums();
    const { data: favoriteSongs, isLoading: isLoadingSongs } = useFavoriteSongs();

    return (
        <aside className="w-64 shrink-0 flex flex-col gap-4 overflow-y-auto h-full pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
            <SidebarSection title={t('playlists')} icon={<ListMusic className="w-3.5 h-3.5" />}>
                {isLoadingPlaylists ? (
                    <div className="flex flex-col gap-1 px-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full rounded" />
                        ))}
                    </div>
                ) : playlists && playlists.length > 0 ? (
                    playlists.map((playlist) => (
                        <SidebarItem
                            key={playlist.Id}
                            to={`/music/playlist/${playlist.Id}`}
                            imageUrl={getPrimaryImageUrl(playlist.Id || '', {
                                width: 64,
                                height: 64,
                            })}
                            name={playlist.Name || t('untitled')}
                            subtitle={
                                playlist.ChildCount !== undefined
                                    ? t('tracks_count', { count: playlist.ChildCount ?? 0 })
                                    : undefined
                            }
                        />
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground px-3">{t('no_playlists')}</span>
                )}
            </SidebarSection>

            <SidebarSection title={t('favorite_artists')} icon={<Mic2 className="w-3.5 h-3.5" />}>
                {isLoadingArtists ? (
                    <div className="flex flex-col gap-1 px-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full rounded" />
                        ))}
                    </div>
                ) : favoriteArtists && favoriteArtists.length > 0 ? (
                    favoriteArtists.map((artist) => (
                        <SidebarItem
                            key={artist.Id}
                            to={`/music/artist/${artist.Id}`}
                            imageUrl={getPrimaryImageUrl(artist.Id || '', {
                                width: 64,
                                height: 64,
                            })}
                            name={artist.Name || 'Unknown'}
                        />
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground px-3">{t('no_favorites')}</span>
                )}
            </SidebarSection>

            <SidebarSection title={t('favorite_albums')} icon={<Disc3 className="w-3.5 h-3.5" />}>
                {isLoadingAlbums ? (
                    <div className="flex flex-col gap-1 px-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full rounded" />
                        ))}
                    </div>
                ) : favoriteAlbums && favoriteAlbums.length > 0 ? (
                    favoriteAlbums.map((album) => (
                        <SidebarItem
                            key={album.Id}
                            to={`/music/album/${album.Id}`}
                            imageUrl={getPrimaryImageUrl(album.Id || '', {
                                width: 64,
                                height: 64,
                            })}
                            name={album.Name || 'Unknown'}
                            subtitle={album.ArtistItems?.[0]?.Name || undefined}
                        />
                    ))
                ) : (
                    <span className="text-xs text-muted-foreground px-3">{t('no_favorites')}</span>
                )}
            </SidebarSection>

            <SidebarSection title={t('favorite_songs')} icon={<Heart className="w-3.5 h-3.5" />}>
                {isLoadingSongs ? (
                    <div className="flex flex-col gap-1 px-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full rounded" />
                        ))}
                    </div>
                ) : favoriteSongs && favoriteSongs.length > 0 ? (
                    favoriteSongs.map((song) => <FavoriteSongItem key={song.Id} song={song} />)
                ) : (
                    <span className="text-xs text-muted-foreground px-3">{t('no_favorites')}</span>
                )}
            </SidebarSection>
        </aside>
    );
};

export default MusicLeftSidebar;
