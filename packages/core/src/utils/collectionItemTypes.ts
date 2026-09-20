import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import type { UseLibraryItemsOptions } from '../hooks/useLibraryItems';
import type { LibraryCollectionType, LibraryView } from '../types/items';

export const COLLECTION_ITEM_TYPES: Partial<Record<LibraryCollectionType, BaseItemKind[]>> = {
    movies: ['Movie'],
    tvshows: ['Series'],
    boxsets: ['BoxSet'],
    music: ['MusicAlbum'],
    musicvideos: ['MusicVideo'],
    homevideos: ['Video', 'Photo'],
    trailers: ['Trailer'],
    books: ['Book', 'AudioBook'],
    photos: ['Photo', 'PhotoAlbum'],
    livetv: ['TvChannel', 'LiveTvChannel'],
    playlists: ['Playlist'],
};

const MIXED_RECENT_ITEM_TYPES: BaseItemKind[] = [
    'Movie',
    'Series',
    'BoxSet',
    'MusicAlbum',
    'MusicVideo',
    'Video',
    'Photo',
    'Book',
    'AudioBook',
    'Playlist',
    'Trailer',
];

export function isLibraryContainer(type?: BaseItemKind | null): boolean {
    return (
        type === 'Folder' ||
        type === 'CollectionFolder' ||
        type === 'UserView' ||
        type === 'AggregateFolder' ||
        type === 'PhotoAlbum'
    );
}

export function isGenericLibrary(collectionType?: LibraryCollectionType | null): boolean {
    return (
        !collectionType ||
        collectionType === 'mixed' ||
        collectionType === 'unknown' ||
        collectionType === 'folders'
    );
}

export function isSupportedLibrary(
    view: Pick<LibraryView, 'Id' | 'Type' | 'CollectionType'>
): boolean {
    if (!view.Id) return false;
    if (!view.CollectionType) return isLibraryContainer(view.Type);
    return (
        isGenericLibrary(view.CollectionType) ||
        Object.hasOwn(COLLECTION_ITEM_TYPES, view.CollectionType)
    );
}

export function getLibraryItemsOptions(
    collectionType?: LibraryCollectionType | null
): UseLibraryItemsOptions {
    const generic = isGenericLibrary(collectionType);
    return {
        collectionType,
        includeItemTypes: collectionType ? COLLECTION_ITEM_TYPES[collectionType] : undefined,
        recursive: !generic && collectionType !== 'photos',
        // Virtual collections and folders are not necessarily backed by local files.
        locationTypes: [],
    };
}

export function getRecentlyAddedItemTypes(
    collectionType?: LibraryCollectionType | null
): BaseItemKind[] {
    return (collectionType && COLLECTION_ITEM_TYPES[collectionType]) || MIXED_RECENT_ITEM_TYPES;
}
