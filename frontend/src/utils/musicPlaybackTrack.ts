import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { MusicPlaybackTrack } from '@/context/MusicPlaybackContext';

export type MusicContextMenuScope = 'song' | 'collection';

export function getMusicContextKind(
    item: Pick<BaseItemDto, 'Type' | 'MediaType'>
): MusicContextMenuScope | null {
    if (item.Type === 'Audio') return 'song';
    if (
        item.Type === 'MusicAlbum' ||
        (item.Type === 'Playlist' && (!item.MediaType || item.MediaType === 'Audio'))
    )
        return 'collection';
    return null;
}

export function isCollectionScope(scope: MusicContextMenuScope): boolean {
    return scope === 'collection';
}

export function getAlbumArtistName(album: BaseItemDto): string {
    return (
        album.ArtistItems?.map((a) => a.Name).join(', ') ||
        album.AlbumArtist ||
        album.Artists?.join(', ') ||
        ''
    );
}

export function toPlaybackTrack(item: BaseItemDto, album?: BaseItemDto): MusicPlaybackTrack {
    return {
        id: item.Id || '',
        title: item.Name || '',
        artist:
            item.ArtistItems?.[0]?.Name ||
            album?.ArtistItems?.[0]?.Name ||
            album?.AlbumArtist ||
            'Unknown',
        albumId: item.AlbumId || album?.Id || '',
        albumName: item.Album || album?.Name || '',
    };
}

export function toPlaybackTracks(items: BaseItemDto[], album?: BaseItemDto): MusicPlaybackTrack[] {
    return items.map((item) => toPlaybackTrack(item, album));
}
