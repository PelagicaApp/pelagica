import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import type { CollectionSortOption } from '../hooks/useConfig';

function getReleaseTime(item: BaseItemDto): number | null {
    if (item.PremiereDate) return new Date(item.PremiereDate).getTime();
    if (item.ProductionYear) return new Date(item.ProductionYear, 0, 1).getTime();
    return null;
}

export function sortCollectionItems(
    items: BaseItemDto[],
    sort: CollectionSortOption
): BaseItemDto[] {
    if (sort === 'Random') {
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    const direction = sort === 'PremiereDateDesc' ? -1 : 1;
    return [...items].sort((a, b) => {
        const timeA = getReleaseTime(a);
        const timeB = getReleaseTime(b);
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;
        return (timeA - timeB) * direction;
    });
}
