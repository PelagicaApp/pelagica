import type { BaseItemKind, CollectionType } from '@jellyfin/sdk/lib/generated-client/models';

export const COLLECTION_ITEM_TYPES: Partial<Record<CollectionType, BaseItemKind[]>> = {
    movies: ['Movie'],
    tvshows: ['Series'],
    boxsets: ['BoxSet'],
    music: ['MusicAlbum'],
    musicvideos: ['MusicVideo'],
    homevideos: ['Video', 'Photo'],
};
