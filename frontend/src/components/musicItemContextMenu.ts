import type { ReactNode } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { MusicPlaybackTrack } from '@/context/MusicPlaybackContext';
import type { MusicContextMenuScope } from '@/utils/musicPlaybackTrack';

export interface MusicContextMenuActions {
    playNow?: boolean;
    shuffle?: boolean;
    queueStart?: boolean;
    queueEnd?: boolean;
    playlist?: boolean;
    favorite?: boolean;
}

export const DEFAULT_MUSIC_CONTEXT_MENU_ACTIONS: Required<MusicContextMenuActions> = {
    playNow: true,
    shuffle: true,
    queueStart: true,
    queueEnd: true,
    playlist: true,
    favorite: true,
};

export interface MusicItemContextMenuProps {
    item: BaseItemDto;
    children: ReactNode;
    /** Override scope inferred from `item.Type`. */
    scope?: MusicContextMenuScope;
    /** Tracks surrounding the selected item when playing from a list. */
    contextTracks?: MusicPlaybackTrack[];
    /** Index of `item` within `contextTracks` for play-now. */
    startIndex?: number;
    /** Toggle individual menu actions. Defaults to all enabled. */
    actions?: MusicContextMenuActions;
}

export function resolveMusicContextMenuActions(
    actions?: MusicContextMenuActions
): Required<MusicContextMenuActions> {
    return { ...DEFAULT_MUSIC_CONTEXT_MENU_ACTIONS, ...actions };
}

/** Visual feedback while long-pressing / when the context menu is open (especially on touch). */
export const MUSIC_CONTEXT_MENU_TRIGGER_CLASS =
    'transition-[background-color,filter] duration-150 touch-manipulation select-none [-webkit-tap-highlight-color:transparent] active:bg-accent/80 active:brightness-[0.88] data-[state=open]:bg-accent/80 data-[state=open]:brightness-[0.88] rounded-lg';
