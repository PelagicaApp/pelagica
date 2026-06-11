'use client';

import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarBrowserListItem } from '@/components/SidebarBrowserListItem';

const ROW_HEIGHT = 52;
const LOAD_MORE_THRESHOLD = 6;

type SidebarBrowserResultsListProps = {
    items: BaseItemDto[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    activeItemPath: string;
    onSelectItem: (item: BaseItemDto) => void;
    emptyMessage: string;
};

export function SidebarBrowserResultsList({
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    activeItemPath,
    onSelectItem,
    emptyMessage,
}: SidebarBrowserResultsListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // TanStack Virtual returns unstable function refs; safe to use here.
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
        gap: 2,
    });

    const virtualRows = virtualizer.getVirtualItems();
    const lastVisibleIndex = virtualRows[virtualRows.length - 1]?.index ?? -1;

    useEffect(() => {
        if (lastVisibleIndex < 0) return;
        if (
            lastVisibleIndex >= items.length - LOAD_MORE_THRESHOLD &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage();
        }
    }, [lastVisibleIndex, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-0.5 pr-0.5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-1.5 py-1.5">
                        <Skeleton className="size-10 shrink-0 rounded-md" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return <p className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</p>;
    }

    return (
        <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border"
        >
            <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                {virtualRows.map((virtualRow) => {
                    const item = items[virtualRow.index];
                    if (!item?.Id) return null;

                    return (
                        <div
                            key={item.Id}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            className="absolute top-0 left-0 w-full"
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                        >
                            <SidebarBrowserListItem
                                item={item}
                                isActive={activeItemPath === `/item/${item.Id}`}
                                onSelect={onSelectItem}
                            />
                        </div>
                    );
                })}
            </div>
            {isFetchingNextPage && (
                <div className="text-muted-foreground py-2 text-center text-xs">Loading more…</div>
            )}
        </div>
    );
}
