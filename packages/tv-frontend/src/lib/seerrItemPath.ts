import { SeerrMediaStatus, type SeerrMediaType, type SeerrSearchResultItem } from '@pelagica/core';

export function getSeerrLibraryPath(
    mediaType: SeerrMediaType,
    jellyfinMediaId: string
): string {
    return mediaType === 'tv' ? `/series/${jellyfinMediaId}` : `/movie/${jellyfinMediaId}`;
}

export function getSeerrHomeItemPath(item: SeerrSearchResultItem): string {
    if (
        item.mediaInfo?.jellyfinMediaId &&
        item.mediaInfo.status === SeerrMediaStatus.AVAILABLE
    ) {
        return getSeerrLibraryPath(item.mediaType, item.mediaInfo.jellyfinMediaId);
    }
    return `/seerr/${item.mediaType}/${item.id}`;
}
