import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { isLibraryContainer } from '@pelagica/core';

export function getItemLink(
    type: BaseItemKind | null | undefined,
    id: string | null | undefined
): string {
    if (!id) {
        return '/';
    }

    if (isLibraryContainer(type)) {
        return `/library/${id}`;
    }

    switch (type) {
        case 'Movie':
            return `/movie/${id}`;
        case 'Series':
            return `/series/${id}`;
        case 'BoxSet':
            return `/boxset/${id}`;
        case 'Genre':
            return `/genre/${id}`;
        case 'Studio':
            return `/studio/${id}`;
        default:
            return `/item/${id}`;
    }
}
