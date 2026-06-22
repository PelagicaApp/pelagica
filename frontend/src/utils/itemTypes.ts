import type { BaseItemKind, CollectionType } from '@jellyfin/sdk/lib/generated-client/models';

export const SUPPORTED_LIBRARY_COLLECTION_TYPES: CollectionType[] = [
    'movies',
    'tvshows',
    'boxsets',
    'music',
    'musicvideos',
    'homevideos',
];

export const DIRECT_PLAY_TYPES: CollectionType[] = ['musicvideos'];

export const COLLECTION_ITEM_TYPES: Partial<Record<CollectionType, BaseItemKind[]>> = {
    movies: ['Movie'],
    tvshows: ['Series'],
    boxsets: ['BoxSet'],
    music: ['MusicAlbum'],
    musicvideos: ['MusicVideo'],
    homevideos: ['Video', 'Photo'],
};
