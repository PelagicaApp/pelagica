import type { GenreItem } from '@/hooks/api/genres/useGenresWithItems';
import { getServerUrl } from './localstorageCredentials';

const STORAGE_KEY_PREFIX = 'genreItemCache';

type ItemMap = Record<string, GenreItem>;

function getStorageKey() {
    const serverUrl = getServerUrl() || 'default';
    return `${STORAGE_KEY_PREFIX}_${serverUrl}`;
}

function getStoredItems(): ItemMap {
    try {
        return JSON.parse(localStorage.getItem(getStorageKey()) || '{}');
    } catch {
        return {};
    }
}

function saveStoredItems(map: ItemMap) {
    localStorage.setItem(getStorageKey(), JSON.stringify(map));
}

export function getCachedGenreItem(genreId: string): GenreItem | undefined {
    const map = getStoredItems();
    return map[genreId];
}

export function setCachedGenreItem(genreId: string, item: GenreItem) {
    const map = getStoredItems();
    map[genreId] = item;
    saveStoredItems(map);
}
