import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, Play, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { ticksToReadableMusicTime } from '@/utils/timeConversion';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { useTranslation } from 'react-i18next';
import {
    useRecentlyAddedAlbums,
    useRecentlyPlayedSongs,
    useFrequentlyPlayedSongs,
    useAllAlbums,
    useAllArtists,
    useMusicSearch,
} from '@/hooks/api/useMusicItems';
import { usePlaylists } from '@/hooks/api/playlist/usePlaylists';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import SectionScroller from '@/components/SectionScroller';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

const SongRow = ({
    song,
    onPlay,
    showAlbum = false,
}: {
    song: BaseItemDto;
    index: number;
    onPlay: () => void;
    showAlbum?: boolean;
}) => (
    <div
        className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 rounded-md cursor-pointer group transition-colors"
        onClick={onPlay}
    >
        <div className="w-8 h-8 relative shrink-0">
            <img
                src={getPrimaryImageUrl(song.AlbumId || song.Id || '', {
                    width: 64,
                    height: 64,
                })}
                alt={song.Name || ''}
                className="w-8 h-8 rounded object-cover"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-3.5 h-3.5 text-white" />
            </div>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm truncate">{song.Name}</span>
            <span className="text-xs text-muted-foreground truncate">
                {song.ArtistItems?.map((a) => a.Name).join(', ') || 'Unknown'}
                {showAlbum && song.Album && ` • ${song.Album}`}
            </span>
        </div>
        {song.UserData?.PlayCount !== undefined && song.UserData.PlayCount > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
                {song.UserData.PlayCount}x
            </span>
        )}
        {song.RunTimeTicks && (
            <span className="text-xs text-muted-foreground shrink-0">
                {ticksToReadableMusicTime(song.RunTimeTicks)}
            </span>
        )}
    </div>
);

const SongList = ({
    songs,
    isLoading,
    emptyMessage,
    showAlbum = false,
}: {
    songs: BaseItemDto[] | undefined;
    isLoading: boolean;
    emptyMessage: string;
    showAlbum?: boolean;
}) => {
    const { loadQueue } = useMusicPlayback();

    const handlePlay = (songs: BaseItemDto[], index: number) => {
        const queue = songs.map((s) => ({
            id: s.Id || '',
            title: s.Name || '',
            artist: s.ArtistItems?.[0]?.Name || 'Unknown',
            albumId: s.AlbumId || '',
            albumName: s.Album || '',
        }));
        loadQueue(queue, index, true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
            </div>
        );
    }

    if (!songs || songs.length === 0) {
        return <span className="text-sm text-muted-foreground px-3">{emptyMessage}</span>;
    }

    return (
        <div className="flex flex-col gap-0.5">
            {songs.map((song, index) => (
                <SongRow
                    key={song.Id}
                    song={song}
                    index={index}
                    showAlbum={showAlbum}
                    onPlay={() => handlePlay(songs, index)}
                />
            ))}
        </div>
    );
};

const AlbumsGrid = ({
    albums,
    isLoading,
    emptyMessage,
}: {
    albums: BaseItemDto[] | undefined;
    isLoading: boolean;
    emptyMessage: string;
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                {[...Array(12)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="h-4 w-3/4 mt-2 rounded" />
                        <Skeleton className="h-3 w-1/2 mt-1 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!albums || albums.length === 0) {
        return <span className="text-sm text-muted-foreground">{emptyMessage}</span>;
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {albums.map((album) => (
                <Link
                    key={album.Id}
                    to={`/music/album/${album.Id}`}
                    className="group flex flex-col"
                >
                    <div className="relative aspect-square overflow-hidden rounded-md">
                        <img
                            src={getPrimaryImageUrl(album.Id || '', {
                                width: 200,
                                height: 200,
                            })}
                            alt={album.Name || ''}
                            className="w-full h-full object-cover group-hover:opacity-75 group-hover:scale-105 transition-all transform-gpu"
                            loading="lazy"
                        />
                    </div>
                    <span className="text-sm mt-1.5 truncate">{album.Name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                        {album.ArtistItems?.[0]?.Name || album.AlbumArtist || ''}
                    </span>
                </Link>
            ))}
        </div>
    );
};

const ArtistsGrid = ({
    artists,
    isLoading,
    emptyMessage,
}: {
    artists: BaseItemDto[] | undefined;
    isLoading: boolean;
    emptyMessage: string;
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <Skeleton className="aspect-square w-full rounded-full" />
                        <Skeleton className="h-4 w-3/4 mt-2 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!artists || artists.length === 0) {
        return <span className="text-sm text-muted-foreground">{emptyMessage}</span>;
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {artists.map((artist) => (
                <Link
                    key={artist.Id}
                    to={`/music/artist/${artist.Id}`}
                    className="group flex flex-col items-center"
                >
                    <div className="relative aspect-square w-full overflow-hidden rounded-full">
                        <img
                            src={getPrimaryImageUrl(artist.Id || '', {
                                width: 200,
                                height: 200,
                            })}
                            alt={artist.Name || ''}
                            className="w-full h-full object-cover group-hover:opacity-75 group-hover:scale-105 transition-all transform-gpu"
                            loading="lazy"
                        />
                    </div>
                    <span className="text-sm mt-1.5 truncate text-center w-full">
                        {artist.Name}
                    </span>
                </Link>
            ))}
        </div>
    );
};

const PlaylistsGrid = ({
    playlists,
    isLoading,
    emptyMessage,
    tracksLabel,
}: {
    playlists: BaseItemDto[] | undefined;
    isLoading: boolean;
    emptyMessage: string;
    tracksLabel: (count: number) => string;
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="h-4 w-3/4 mt-2 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!playlists || playlists.length === 0) {
        return <span className="text-sm text-muted-foreground">{emptyMessage}</span>;
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {playlists.map((playlist) => (
                <Link
                    key={playlist.Id}
                    to={`/music/playlist/${playlist.Id}`}
                    className="group flex flex-col"
                >
                    <div className="relative aspect-square overflow-hidden rounded-md">
                        <img
                            src={getPrimaryImageUrl(playlist.Id || '', {
                                width: 200,
                                height: 200,
                            })}
                            alt={playlist.Name || ''}
                            className="w-full h-full object-cover group-hover:opacity-75 group-hover:scale-105 transition-all transform-gpu"
                            loading="lazy"
                        />
                    </div>
                    <span className="text-sm mt-1.5 truncate">{playlist.Name}</span>
                    {playlist.ChildCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                            {tracksLabel(playlist.ChildCount || 0)}
                        </span>
                    )}
                </Link>
            ))}
        </div>
    );
};

const SearchResults = ({ searchTerm }: { searchTerm: string }) => {
    const { t } = useTranslation('music');
    const { data: results, isLoading } = useMusicSearch(searchTerm);
    const { loadQueue } = useMusicPlayback();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
            </div>
        );
    }

    if (!results || results.length === 0) {
        return <span className="text-sm text-muted-foreground">{t('no_results_found')}</span>;
    }

    const songs = results.filter((r) => r.Type === 'Audio');
    const albums = results.filter((r) => r.Type === 'MusicAlbum');
    const artists = results.filter((r) => r.Type === 'MusicArtist');

    const handlePlaySong = (index: number) => {
        const queue = songs.map((s) => ({
            id: s.Id || '',
            title: s.Name || '',
            artist: s.ArtistItems?.[0]?.Name || 'Unknown',
            albumId: s.AlbumId || '',
            albumName: s.Album || '',
        }));
        loadQueue(queue, index, true);
    };

    return (
        <div className="flex flex-col gap-6">
            {artists.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        {t('artists')}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto">
                        {artists.map((artist) => (
                            <Link
                                key={artist.Id}
                                to={`/music/artist/${artist.Id}`}
                                className="flex flex-col items-center shrink-0 group"
                            >
                                <img
                                    src={getPrimaryImageUrl(artist.Id || '', {
                                        width: 128,
                                        height: 128,
                                    })}
                                    alt={artist.Name || ''}
                                    className="w-16 h-16 rounded-full object-cover group-hover:opacity-75 transition-opacity"
                                />
                                <span className="text-xs mt-1 truncate max-w-16">
                                    {artist.Name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            {albums.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        {t('albums')}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto">
                        {albums.map((album) => (
                            <Link
                                key={album.Id}
                                to={`/music/album/${album.Id}`}
                                className="flex flex-col shrink-0 group"
                            >
                                <img
                                    src={getPrimaryImageUrl(album.Id || '', {
                                        width: 128,
                                        height: 128,
                                    })}
                                    alt={album.Name || ''}
                                    className="w-24 h-24 rounded-md object-cover group-hover:opacity-75 transition-opacity"
                                />
                                <span className="text-xs mt-1 truncate max-w-24">{album.Name}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-24">
                                    {album.ArtistItems?.[0]?.Name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            {songs.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        {t('songs')}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                        {songs.map((song, index) => (
                            <SongRow
                                key={song.Id}
                                song={song}
                                index={index}
                                showAlbum
                                onPlay={() => handlePlaySong(index)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MusicMainContent = () => {
    const { t } = useTranslation('music');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: recentAlbums, isLoading: isLoadingRecent } = useRecentlyAddedAlbums(20);
    const { data: recentlyPlayed, isLoading: isLoadingPlayed } = useRecentlyPlayedSongs(10);
    const { data: frequentlyPlayed, isLoading: isLoadingFrequent } = useFrequentlyPlayedSongs(10);
    const { data: allAlbumsData, isLoading: isLoadingAllAlbums } = useAllAlbums(100);
    const { data: allArtistsData, isLoading: isLoadingAllArtists } = useAllArtists(100);
    const { data: currentUser } = useCurrentUser();
    const { data: playlists, isLoading: isLoadingPlaylists } = usePlaylists(currentUser?.Id);

    const isSearching = searchTerm.trim().length > 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    className="pl-9 pr-9"
                    placeholder={t('search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setSearchTerm('')}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isSearching ? (
                <SearchResults searchTerm={debouncedSearch} />
            ) : (
                <>
                    {recentAlbums && recentAlbums.length > 0 && (
                        <SectionScroller
                            title={
                                <h2 className="text-lg font-semibold">
                                    {t('recently_added_albums')}
                                </h2>
                            }
                            items={recentAlbums.map((album) => (
                                <Link
                                    key={album.Id}
                                    to={`/music/album/${album.Id}`}
                                    className="group flex flex-col shrink-0"
                                >
                                    <div className="relative w-28 h-28 overflow-hidden rounded-md">
                                        <img
                                            src={getPrimaryImageUrl(album.Id || '', {
                                                width: 200,
                                                height: 200,
                                            })}
                                            alt={album.Name || ''}
                                            className="w-28 h-28 object-cover group-hover:opacity-75 group-hover:scale-105 transition-all transform-gpu"
                                            loading="lazy"
                                        />
                                    </div>
                                    <span className="text-xs mt-1 truncate max-w-28">
                                        {album.Name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-28">
                                        {album.ArtistItems?.[0]?.Name || album.AlbumArtist || ''}
                                    </span>
                                </Link>
                            ))}
                        />
                    )}
                    {isLoadingRecent && (
                        <div className="flex gap-3">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="w-28 h-28 rounded-md shrink-0" />
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-semibold">{t('recently_played')}</h2>
                            <SongList
                                songs={recentlyPlayed}
                                isLoading={isLoadingPlayed}
                                emptyMessage={t('no_songs_found')}
                                showAlbum
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-semibold">{t('frequently_played')}</h2>
                            <SongList
                                songs={frequentlyPlayed}
                                isLoading={isLoadingFrequent}
                                emptyMessage={t('no_songs_found')}
                                showAlbum
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="albums" className="w-full">
                        <TabsList>
                            <TabsTrigger value="albums">{t('albums')}</TabsTrigger>
                            <TabsTrigger value="artists">{t('artists')}</TabsTrigger>
                            <TabsTrigger value="playlists">{t('playlists')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="albums" className="mt-4">
                            <AlbumsGrid
                                albums={allAlbumsData?.items}
                                isLoading={isLoadingAllAlbums}
                                emptyMessage={t('no_albums_found')}
                            />
                        </TabsContent>
                        <TabsContent value="artists" className="mt-4">
                            <ArtistsGrid
                                artists={allArtistsData?.items}
                                isLoading={isLoadingAllArtists}
                                emptyMessage={t('no_artists_found')}
                            />
                        </TabsContent>
                        <TabsContent value="playlists" className="mt-4">
                            <PlaylistsGrid
                                playlists={playlists}
                                isLoading={isLoadingPlaylists}
                                emptyMessage={t('no_playlists_found')}
                                tracksLabel={(count) => t('tracks_count', { count })}
                            />
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
};

export default MusicMainContent;
