import type {
    BaseItemDto,
    BaseItemKind,
    MediaType,
} from '@jellyfin/sdk/lib/generated-client/models';

export type PlaylistMediaType = Extract<MediaType, 'Audio' | 'Video'>;

const AUDIO_PLAYLIST_ITEM_TYPES: BaseItemKind[] = ['Audio', 'MusicAlbum'];

const VIDEO_PLAYLIST_ITEM_TYPES: BaseItemKind[] = [
    'Movie',
    'Episode',
    'Series',
    'Season',
    'BoxSet',
    'Video',
    'MusicVideo',
];

export function getPlaylistMediaType(item: BaseItemDto): PlaylistMediaType | null {
    if (!item.Type) return null;
    if (item.Type === 'Playlist') {
        if (item.MediaType === 'Audio' || item.MediaType === 'Video') return item.MediaType;
        return null;
    }
    if (AUDIO_PLAYLIST_ITEM_TYPES.includes(item.Type)) return 'Audio';
    if (VIDEO_PLAYLIST_ITEM_TYPES.includes(item.Type)) return 'Video';
    return null;
}
