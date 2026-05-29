'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { cn } from '@/lib/utils';
import {
    getItemSubtitle,
    getItemTypeLabel,
    getSidebarPosterUrl,
} from '@/utils/sidebarBrowseItems';

type SidebarBrowserListItemProps = {
    item: BaseItemDto;
    isActive?: boolean;
    onSelect: (item: BaseItemDto) => void;
};

export function SidebarBrowserListItem({ item, isActive, onSelect }: SidebarBrowserListItemProps) {
    const [posterError, setPosterError] = useState(false);
    const posterUrl = getSidebarPosterUrl(item);
    const isSquare = item.Type === 'MusicAlbum';

    return (
        <li>
            <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                    'hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors',
                    isActive &&
                        'bg-sidebar-accent text-sidebar-accent-foreground ring-primary/50 ring-1'
                )}
            >
                <div
                    className={cn(
                        'bg-muted relative size-10 shrink-0 overflow-hidden rounded-md',
                        isSquare ? 'size-10' : 'size-10'
                    )}
                >
                    {!posterError ? (
                        <img
                            src={posterUrl}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                            onError={() => setPosterError(true)}
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center">
                            <ImageOff className="text-muted-foreground size-4" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">
                        {item.Name ?? 'Untitled'}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                        {getItemTypeLabel(item.Type)} · {getItemSubtitle(item)}
                    </p>
                </div>
            </button>
        </li>
    );
}
