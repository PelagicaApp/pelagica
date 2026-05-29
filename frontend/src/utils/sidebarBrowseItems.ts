import type { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import type { BrowserMediaCategory } from '@/utils/sidebarLibraryNavigation';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';

const LIBRARY_ITEM_TYPES: BaseItemKind[] = ['Series', 'Movie', 'BoxSet', 'MusicAlbum'];

const CATEGORY_ITEM_TYPES: Record<BrowserMediaCategory, BaseItemKind[]> = {
    music: ['MusicAlbum'],
    series: ['Series', 'BoxSet'],
    movie: ['Movie'],
};

export function getIncludeItemTypesForCategory(
    category: BrowserMediaCategory | 'all'
): BaseItemKind[] {
    if (category === 'all') return LIBRARY_ITEM_TYPES;
    return CATEGORY_ITEM_TYPES[category];
}

export function getItemTypeLabel(type?: string | null): string {
    switch (type) {
        case 'MusicAlbum':
            return 'Album';
        case 'Series':
            return 'Series';
        case 'Movie':
            return 'Movie';
        case 'BoxSet':
            return 'Box Set';
        default:
            return type ?? 'Item';
    }
}

export function getItemSubtitle(item: BaseItemDto): string {
    if (item.Type === 'MusicAlbum' && item.AlbumArtist) {
        return item.AlbumArtist;
    }
    if (item.PremiereDate) {
        return String(new Date(item.PremiereDate).getFullYear());
    }
    if (item.ProductionYear) {
        return String(item.ProductionYear);
    }
    return getItemTypeLabel(item.Type);
}

export function getSidebarPosterUrl(item: BaseItemDto): string {
    const isSquare = item.Type === 'MusicAlbum';
    return getPrimaryImageUrl(
        item.Id!,
        isSquare ? { height: 112, width: 112 } : { height: 168, width: 112 },
        item.ImageTags?.Primary
    );
}
