import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models';

export const SUPPORTED_LIBRARY_COLLECTION_TYPES: CollectionType[] = [
    'movies',
    'tvshows',
    'boxsets',
    'music',
    'musicvideos',
    'homevideos',
];
