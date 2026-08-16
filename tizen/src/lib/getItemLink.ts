import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';

export function getItemLink(
    type: BaseItemKind | null | undefined,
    id: string | null | undefined
): string {
    if (!type || !id) {
        return '/';
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
        default:
            return '/';
    }
}
