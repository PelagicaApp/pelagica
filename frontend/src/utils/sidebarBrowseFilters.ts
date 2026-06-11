import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import type { BrowserMediaCategory } from '@/utils/sidebarLibraryNavigation';

export type MusicBrowseFilter = 'albums' | 'artists' | 'playlists' | 'genres';
export type VideoBrowseFilter = 'all' | 'genres';

export type SidebarBrowseFilter = MusicBrowseFilter | VideoBrowseFilter;

const MUSIC_FILTERS: MusicBrowseFilter[] = ['albums', 'artists', 'playlists', 'genres'];
const VIDEO_FILTERS: VideoBrowseFilter[] = ['all', 'genres'];

export function getDefaultBrowseFilter(category: BrowserMediaCategory): SidebarBrowseFilter {
    return category === 'music' ? 'albums' : 'all';
}

export function isMusicBrowseFilter(value: string): value is MusicBrowseFilter {
    return (MUSIC_FILTERS as string[]).includes(value);
}

export function isVideoBrowseFilter(value: string): value is VideoBrowseFilter {
    return (VIDEO_FILTERS as string[]).includes(value);
}

export function normalizeBrowseFilter(
    category: BrowserMediaCategory,
    value: string
): SidebarBrowseFilter {
    if (category === 'music' && isMusicBrowseFilter(value)) return value;
    if (category !== 'music' && isVideoBrowseFilter(value)) return value;
    return getDefaultBrowseFilter(category);
}

export function getBrowseFiltersForCategory(
    category: BrowserMediaCategory
): { value: SidebarBrowseFilter; label: string }[] {
    if (category === 'music') {
        return [
            { value: 'albums', label: 'Albums' },
            { value: 'artists', label: 'Artists' },
            { value: 'playlists', label: 'Playlists' },
            { value: 'genres', label: 'Genres' },
        ];
    }
    return [
        { value: 'all', label: 'All' },
        { value: 'genres', label: 'Genres' },
    ];
}

export function isGenresBrowseFilter(filter: SidebarBrowseFilter): filter is 'genres' {
    return filter === 'genres';
}

export function getItemTypesForBrowseFilter(
    category: BrowserMediaCategory,
    filter: SidebarBrowseFilter
): BaseItemKind[] | null {
    if (isGenresBrowseFilter(filter)) return null;

    if (category === 'music') {
        switch (filter as MusicBrowseFilter) {
            case 'albums':
                return ['MusicAlbum'];
            case 'artists':
                return ['MusicArtist'];
            case 'playlists':
                return ['Playlist'];
            default:
                return ['MusicAlbum'];
        }
    }

    switch (category) {
        case 'series':
            return ['Series', 'BoxSet'];
        case 'movie':
            return ['Movie'];
        default:
            return ['Movie'];
    }
}

export function getGenresIncludeItemTypes(category: BrowserMediaCategory): BaseItemKind[] {
    switch (category) {
        case 'music':
            return ['MusicAlbum'];
        case 'series':
            return ['Series'];
        case 'movie':
            return ['Movie'];
        default:
            return ['Movie'];
    }
}

/** Query param on genre item URLs — scopes the detail grid to the active media tab. */
export const GENRE_MEDIA_PARAM = 'media';

export function parseGenreMediaCategory(value: string | null): BrowserMediaCategory | null {
    if (value === 'music' || value === 'series' || value === 'movie') return value;
    return null;
}

/** Item types shown when opening a genre from the sidebar (or genre page with ?media=). */
export function getGenreDetailIncludeTypes(category: BrowserMediaCategory): BaseItemKind[] {
    if (category === 'music') return ['MusicAlbum'];
    return getGenresIncludeItemTypes(category);
}

export function buildGenreItemUrl(
    itemId: string,
    category: BrowserMediaCategory,
    libraryId?: string | null
): string {
    const params = new URLSearchParams();
    params.set(GENRE_MEDIA_PARAM, category);
    if (libraryId) params.set('library', libraryId);
    return `/item/${itemId}?${params.toString()}`;
}
