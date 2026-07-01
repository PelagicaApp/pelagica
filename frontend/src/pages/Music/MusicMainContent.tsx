import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { renderItemFallbackIcon } from '@/utils/itemFallbackIcon';
import { getItemUrl } from '@/utils/itemUrl';
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
import MusicAlbumCard from '@/components/MusicAlbumCard';
import MusicSongRow from '@/components/MusicSongRow';
import { toPlaybackTracks } from '@/utils/musicPlaybackTrack';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

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

    const playbackTracks = songs ? toPlaybackTracks(songs) : [];

    const handlePlay = (index: number) => {
        loadQueue(playbackTracks, index, true);
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
                <MusicSongRow
                    key={song.Id}
                    song={song}
                    showAlbum={showAlbum}
                    contextTracks={playbackTracks}
                    startIndex={index}
                    onPlay={() => handlePlay(index)}
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {albums.map((album) => (
                <MusicAlbumCard key={album.Id} album={album} />
            ))}
        </div>
    );
};

const ArtistAvatar = ({ artist }: { artist: BaseItemDto }) => {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
        return (
            <div className="relative aspect-square w-full overflow-hidden rounded-full bg-muted flex items-center justify-center">
                {renderItemFallbackIcon(artist.Type, {
                    className: 'w-1/2 h-1/2 text-muted-foreground',
                    strokeWidth: 1.5,
                })}
            </div>
        );
    }

    return (
        <div className="relative aspect-square w-full overflow-hidden rounded-full">
            <img
                src={getPrimaryImageUrl(artist.Id || '', {
                    width: 200,
                    height: 200,
                })}
                alt={artist.Name || ''}
                className="w-full h-full object-cover group-hover:opacity-75 group-hover:scale-105 transition-all transform-gpu"
                loading="lazy"
                onError={() => setImageError(true)}
            />
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {artists.map((artist) => (
                <Link
                    key={artist.Id}
                    to={getItemUrl(artist.Type, artist.Id)}
                    className="group flex flex-col items-center"
                >
                    <ArtistAvatar artist={artist} />
                    <span className="text-sm mt-2 truncate text-center w-full">{artist.Name}</span>
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
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
                    <span className="text-sm mt-2 truncate">{playlist.Name}</span>
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

    const songPlaybackTracks = toPlaybackTracks(songs);

    const handlePlaySong = (index: number) => {
        loadQueue(songPlaybackTracks, index, true);
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
                                to={getItemUrl(artist.Type, artist.Id)}
                                className="flex flex-col items-center shrink-0 group"
                            >
                                <img
                                    src={getPrimaryImageUrl(artist.Id || '', {
                                        width: 160,
                                        height: 160,
                                    })}
                                    alt={artist.Name || ''}
                                    className="w-20 h-20 rounded-full object-cover group-hover:opacity-75 transition-opacity"
                                />
                                <span className="text-sm mt-1.5 truncate max-w-20">
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
                            <MusicAlbumCard
                                key={album.Id}
                                album={album}
                                className="shrink-0"
                                posterClassName="relative w-32 h-32 overflow-hidden rounded-md"
                                imageClassName="w-32 h-32 object-cover group-hover:opacity-75 transition-opacity"
                                imageSize={{ width: 200, height: 200 }}
                                titleClassName="text-sm mt-1.5 truncate max-w-32"
                                subtitleClassName="text-xs text-muted-foreground truncate max-w-32"
                            />
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
                            <MusicSongRow
                                key={song.Id}
                                song={song}
                                showAlbum
                                contextTracks={songPlaybackTracks}
                                startIndex={index}
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
                                <MusicAlbumCard
                                    key={album.Id}
                                    album={album}
                                    className="shrink-0"
                                    posterClassName="relative w-36 h-36 overflow-hidden rounded-md"
                                    imageClassName="w-36 h-36 object-cover group-hover:opacity-75 group-hover:scale-105 transition-all transform-gpu"
                                    imageSize={{ width: 288, height: 288 }}
                                    titleClassName="text-sm mt-1.5 truncate max-w-36"
                                    subtitleClassName="text-xs text-muted-foreground truncate max-w-36"
                                />
                            ))}
                        />
                    )}
                    {isLoadingRecent && (
                        <div className="flex gap-3">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="w-36 h-36 rounded-md shrink-0" />
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
