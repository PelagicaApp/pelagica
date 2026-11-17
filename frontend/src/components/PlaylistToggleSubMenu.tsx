import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ListMusic, ListVideo, Loader2, Plus } from 'lucide-react';
import {
    ContextMenuCheckboxItem,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
    useAddToPlaylist,
    useCurrentUser,
    usePlaylistPresence,
    usePlaylists,
    useRemoveFromPlaylist,
} from '@pelagica/core';
import type { PlaylistMediaType } from '@/utils/playlistMediaType';

interface PlaylistToggleSubMenuProps {
    item: BaseItemDto;
    mediaType: PlaylistMediaType;
    onCreatePlaylist: () => void;
}

export function PlaylistToggleSubMenu({
    item,
    mediaType,
    onCreatePlaylist,
}: PlaylistToggleSubMenuProps) {
    const { t } = useTranslation('item');
    const Icon = mediaType === 'Audio' ? ListMusic : ListVideo;

    return (
        <ContextMenuSub>
            <ContextMenuSubTrigger>
                <Icon />
                {t('add_to_playlist')}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56 max-h-80 overflow-y-auto">
                {/* Mounted only while the submenu is open, so playlists aren't fetched per card. */}
                <PlaylistToggleList item={item} mediaType={mediaType} />
                <ContextMenuSeparator />
                <ContextMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        onCreatePlaylist();
                    }}
                >
                    <Plus />
                    {t('new_playlist')}
                </ContextMenuItem>
            </ContextMenuSubContent>
        </ContextMenuSub>
    );
}

/** Folders (series, seasons, collections) expand into their children when added. */
function isFolderItem(item: BaseItemDto): boolean {
    return Boolean(item.IsFolder);
}

function PlaylistToggleList({
    item,
    mediaType,
}: {
    item: BaseItemDto;
    mediaType: PlaylistMediaType;
}) {
    const { t } = useTranslation('item');
    const { t: tMusic } = useTranslation('music');
    const { data: currentUser } = useCurrentUser();
    const userId = currentUser?.Id ?? undefined;
    const { data: playlists, isLoading } = usePlaylists(userId, { mediaTypes: [mediaType] });
    const addToPlaylist = useAddToPlaylist();
    const removeFromPlaylist = useRemoveFromPlaylist();
    const [pendingId, setPendingId] = useState<string | null>(null);

    const isFolder = isFolderItem(item);
    const playlistIds = useMemo(
        () => playlists?.map((p) => p.Id).filter((id): id is string => Boolean(id)),
        [playlists]
    );
    const { data: presence, isLoading: isLoadingPresence } = usePlaylistPresence(
        isFolder ? undefined : (item.Id ?? undefined),
        playlistIds,
        userId
    );

    if (isLoading || (!isFolder && isLoadingPresence && playlistIds?.length)) {
        return (
            <ContextMenuItem disabled>
                <Loader2 className="animate-spin" />
                {t('loading')}
            </ContextMenuItem>
        );
    }

    if (!playlists?.length) {
        return <ContextMenuItem disabled>{tMusic('no_playlists')}</ContextMenuItem>;
    }

    const toggle = async (playlistId: string) => {
        if (!item.Id || pendingId) return;
        setPendingId(playlistId);
        try {
            const entry = presence?.[playlistId];
            if (entry?.present && entry.playlistItemId) {
                await removeFromPlaylist.mutateAsync({
                    playlistId,
                    entryIds: [entry.playlistItemId],
                });
            } else {
                await addToPlaylist.mutateAsync({ playlistId, itemIds: [item.Id], userId });
            }
        } catch (error) {
            console.error('Error updating playlist:', error);
        } finally {
            setPendingId(null);
        }
    };

    return (
        <>
            {playlists.map((playlist) => {
                const id = playlist.Id!;
                const name = playlist.Name || tMusic('untitled');
                const isPending = pendingId === id;

                // A folder can't be "in" a playlist, so offer add-only.
                if (isFolder) {
                    return (
                        <ContextMenuItem
                            key={id}
                            disabled={Boolean(pendingId)}
                            onSelect={(e) => {
                                e.preventDefault();
                                toggle(id);
                            }}
                        >
                            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                            <span className="truncate">{name}</span>
                        </ContextMenuItem>
                    );
                }

                return (
                    <ContextMenuCheckboxItem
                        key={id}
                        checked={Boolean(presence?.[id]?.present)}
                        disabled={Boolean(pendingId)}
                        onSelect={(e) => {
                            e.preventDefault();
                            toggle(id);
                        }}
                    >
                        <span className="truncate">{name}</span>
                        {isPending && <Loader2 className="ml-auto animate-spin" />}
                    </ContextMenuCheckboxItem>
                );
            })}
        </>
    );
}
