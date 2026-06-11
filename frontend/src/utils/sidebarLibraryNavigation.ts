import type { BaseItemDto, CollectionType } from '@jellyfin/sdk/lib/generated-client/models';
export type BrowserMediaCategory = 'music' | 'series' | 'movie';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '@/utils/supportedLibraryCollectionTypes';

const CATEGORY_COLLECTION_TYPES: Record<BrowserMediaCategory, CollectionType[]> = {
    music: ['music'],
    series: ['tvshows', 'boxsets'],
    movie: ['movies'],
};

export function getSupportedLibraries(views?: BaseItemDto[] | null) {
    return (
        views?.filter((library) =>
            SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(library.CollectionType!)
        ) ?? []
    );
}

export function collectionTypeToCategory(
    collectionType?: CollectionType | null
): BrowserMediaCategory {
    if (collectionType === 'music') return 'music';
    if (collectionType === 'tvshows' || collectionType === 'boxsets') return 'series';
    return 'movie';
}

export function findLibraryIdForCategory(
    views: BaseItemDto[] | null | undefined,
    category: BrowserMediaCategory | 'all'
): string | null {
    const libraries = getSupportedLibraries(views);
    if (libraries.length === 0) return null;

    if (category === 'all') {
        return libraries[0]?.Id ?? null;
    }

    const matchingTypes = CATEGORY_COLLECTION_TYPES[category];
    const match = libraries.find(
        (library) => library.CollectionType && matchingTypes.includes(library.CollectionType)
    );
    return match?.Id ?? libraries[0]?.Id ?? null;
}

export function buildLibrarySearchParams(libraryId: string) {
    return new URLSearchParams({
        library: libraryId,
        page: '0',
        sortBy: 'Name',
        sortOrder: 'Ascending',
    });
}
