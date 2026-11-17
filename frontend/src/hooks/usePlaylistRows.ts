import { useMemo } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

export interface PlaylistRow {
    entry: BaseItemDto;
    fullIndex: number;
    sortId: string;
}

export function usePlaylistRows(
    entries: BaseItemDto[] | undefined,
    filter: (entry: BaseItemDto) => boolean
): PlaylistRow[] {
    return useMemo(() => {
        const seen = new Map<string, number>();
        const rows: PlaylistRow[] = [];
        entries?.forEach((entry, fullIndex) => {
            const base = entry.PlaylistItemId || entry.Id || `entry-${fullIndex}`;
            const occurrence = seen.get(base) ?? 0;
            seen.set(base, occurrence + 1);
            if (filter(entry)) {
                rows.push({ entry, fullIndex, sortId: `${base}#${occurrence}` });
            }
        });
        return rows;
    }, [entries, filter]);
}
