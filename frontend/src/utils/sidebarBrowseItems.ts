import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { SidebarGenreItem } from '@/utils/enrichGenresWithItemCounts';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';

export function getItemTypeLabel(type?: string | null): string {
    switch (type) {
        case 'MusicAlbum':
            return 'Album';
        case 'MusicArtist':
            return 'Artist';
        case 'Playlist':
            return 'Playlist';
        case 'Genre':
            return 'Genre';
        case 'MusicGenre':
            return 'Genre';
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
    if (item.Type === 'Genre' || item.Type === 'MusicGenre') {
        if (item.ChildCount != null) {
            if (item.ChildCount === 0) return 'No items';
            return item.ChildCount === 1 ? '1 item' : `${item.ChildCount} items`;
        }
        return 'Genre';
    }
    if (item.Type === 'Playlist' && item.ChildCount != null) {
        return `${item.ChildCount} tracks`;
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
    const genreItem = item as SidebarGenreItem;
    const imageItemId = genreItem.SidebarCoverItemId ?? item.Id!;
    const imageTag = genreItem.SidebarCoverItemId
        ? genreItem.SidebarCoverImageTag
        : item.ImageTags?.Primary;
    const isSquare =
        !genreItem.SidebarCoverItemId &&
        (item.Type === 'MusicAlbum' ||
            item.Type === 'MusicArtist' ||
            item.Type === 'Playlist' ||
            item.Type === 'Genre' ||
            item.Type === 'MusicGenre');
    return getPrimaryImageUrl(
        imageItemId,
        isSquare ? { height: 112, width: 112 } : { height: 168, width: 112 },
        imageTag
    );
}
