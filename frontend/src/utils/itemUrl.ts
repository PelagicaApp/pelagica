import type { BaseItemKind, MediaType } from '@jellyfin/sdk/lib/generated-client/models';

const DIRECT_PLAY_ROUTES: Partial<Record<BaseItemKind, string>> = {
    MusicVideo: '/play',
    Video: '/play',
    Photo: '/photo',
    TvChannel: '/play',
};

const MUSIC_ROUTES: Partial<Record<BaseItemKind, string>> = {
    MusicAlbum: '/music/album',
    MusicArtist: '/music/artist',
};

const STANDALONE_ROUTES: Partial<Record<BaseItemKind, string>> = {
    Person: '/person',
    Genre: '/genre',
    MusicGenre: '/genre',
    Studio: '/studio',
};

export function isMusicPlaylist(mediaType: MediaType | null | undefined): boolean {
    return mediaType === 'Audio';
}

export function getItemUrl(
    type: BaseItemKind | undefined,
    id: string | undefined,
    mediaType?: MediaType | null
): string {
    if (!id) return '/';
    if (type === 'Playlist') {
        return isMusicPlaylist(mediaType) ? `/music/playlist/${id}` : `/item/${id}`;
    }
    if (type && DIRECT_PLAY_ROUTES[type]) return `${DIRECT_PLAY_ROUTES[type]}/${id}`;
    if (type && MUSIC_ROUTES[type]) return `${MUSIC_ROUTES[type]}/${id}`;
    if (type && STANDALONE_ROUTES[type]) return `${STANDALONE_ROUTES[type]}/${id}`;
    return `/item/${id}`;
}
