import { useMemo, useState, type ReactNode } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Heart, ListEnd, ListMusic, ListPlus, ListStart, Play, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { useFavorite } from '@/hooks/api/useFavorite';
import { useAlbumTracks } from '@/hooks/api/useAlbumTracks';
import { AddToPlaylistDialog } from '@/components/AddToPlaylistDialog';
import type { MusicPlaybackTrack } from '@/context/MusicPlaybackContext';
import {
    resolveMusicContextMenuActions,
    type MusicContextMenuActions,
    type MusicItemContextMenuProps,
} from '@/components/musicItemContextMenu';
import {
    getMusicContextKind,
    isCollectionScope,
    toPlaybackTrack,
    toPlaybackTracks,
    type MusicContextMenuScope,
} from '@/utils/musicPlaybackTrack';

const MusicItemContextMenu = ({
    item,
    children,
    scope,
    contextTracks,
    startIndex = 0,
    actions,
}: MusicItemContextMenuProps) => {
    const resolvedScope = scope ?? getMusicContextKind(item.Type);
    const resolvedActions = resolveMusicContextMenuActions(actions);

    if (!resolvedScope) {
        return children;
    }

    return (
        <MusicItemContextMenuContent
            item={item}
            scope={resolvedScope}
            contextTracks={contextTracks}
            startIndex={startIndex}
            actions={resolvedActions}
        >
            {children}
        </MusicItemContextMenuContent>
    );
};

interface MusicItemContextMenuContentProps {
    item: BaseItemDto;
    scope: MusicContextMenuScope;
    contextTracks?: MusicPlaybackTrack[];
    startIndex: number;
    actions: Required<MusicContextMenuActions>;
    children: ReactNode;
}

const MusicItemContextMenuContent = ({
    item,
    scope,
    contextTracks,
    startIndex,
    actions,
    children,
}: MusicItemContextMenuContentProps) => {
    const { t } = useTranslation('music');
    const { t: tItem } = useTranslation('item');
    const { loadQueue, loadQueueShuffled, addToQueueStart, addToQueueEnd } = useMusicPlayback();
    const { isFavorite, toggleFavorite, isLoading: isFavoriteLoading } = useFavorite(item.Id);
    const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
    const [playlistDialogItemIds, setPlaylistDialogItemIds] = useState<string[]>([]);

    const isSong = scope === 'song';
    const isCollection = isCollectionScope(scope);

    const { data: collectionTracks, isLoading: isLoadingCollectionTracks } = useAlbumTracks(
        isCollection ? item.Id : undefined
    );

    const tracks = useMemo(() => {
        if (isCollection) {
            return collectionTracks ? toPlaybackTracks(collectionTracks, item) : [];
        }
        if (contextTracks && contextTracks.length > 0) {
            return contextTracks;
        }
        return [toPlaybackTrack(item)];
    }, [isCollection, collectionTracks, item, contextTracks]);

    const selectedTrack = useMemo(() => toPlaybackTrack(item), [item]);

    const playlistItemIds = useMemo(() => {
        if (isCollection) {
            return tracks.map((track) => track.id).filter(Boolean);
        }
        return item.Id ? [item.Id] : [];
    }, [isCollection, tracks, item.Id]);

    const playbackDisabled = isCollection
        ? isLoadingCollectionTracks || tracks.length === 0
        : !item.Id;

    const playlistDisabled = playbackDisabled || playlistItemIds.length === 0;

    const showAddToSubmenu = actions.queueStart || actions.queueEnd || actions.playlist;

    const handlePlayNow = () => {
        loadQueue(tracks, startIndex, true);
    };

    const handleShuffleNow = () => {
        if (isSong) {
            loadQueueShuffled([selectedTrack], true);
            return;
        }
        loadQueueShuffled(tracks, true);
    };

    const handleAddToQueueStart = () => {
        addToQueueStart(isSong ? [selectedTrack] : tracks);
    };

    const handleAddToQueueEnd = () => {
        addToQueueEnd(isSong ? [selectedTrack] : tracks);
    };

    const handleFavorite = () => {
        toggleFavorite(!isFavorite);
    };

    const handleOpenPlaylistDialog = (e: Event) => {
        e.preventDefault();
        if (playlistItemIds.length === 0) return;
        setPlaylistDialogItemIds(playlistItemIds);
        setPlaylistDialogOpen(true);
    };

    const handlePlaylistDialogOpenChange = (open: boolean) => {
        setPlaylistDialogOpen(open);
        if (!open) {
            setPlaylistDialogItemIds([]);
        }
    };

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                    {actions.playNow && (
                        <ContextMenuItem disabled={playbackDisabled} onSelect={handlePlayNow}>
                            <Play />
                            {t('play_now')}
                        </ContextMenuItem>
                    )}
                    {actions.shuffle && (
                        <ContextMenuItem disabled={playbackDisabled} onSelect={handleShuffleNow}>
                            <Shuffle />
                            {t('shuffle_now')}
                        </ContextMenuItem>
                    )}
                    {showAddToSubmenu && (
                        <ContextMenuSub>
                            <ContextMenuSubTrigger disabled={playbackDisabled}>
                                <ListPlus />
                                {t('add_to')}
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48">
                                {actions.queueStart && (
                                    <ContextMenuItem
                                        disabled={playbackDisabled}
                                        onSelect={handleAddToQueueStart}
                                    >
                                        <ListStart />
                                        {t('queue_start')}
                                    </ContextMenuItem>
                                )}
                                {actions.queueEnd && (
                                    <ContextMenuItem
                                        disabled={playbackDisabled}
                                        onSelect={handleAddToQueueEnd}
                                    >
                                        <ListEnd />
                                        {t('queue_end')}
                                    </ContextMenuItem>
                                )}
                                {actions.playlist && (
                                    <ContextMenuItem
                                        disabled={playlistDisabled}
                                        onSelect={handleOpenPlaylistDialog}
                                    >
                                        <ListMusic />
                                        {t('playlist')}
                                    </ContextMenuItem>
                                )}
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                    )}
                    {actions.favorite && (
                        <ContextMenuItem disabled={isFavoriteLoading} onSelect={handleFavorite}>
                            <Heart fill={isFavorite ? 'currentColor' : 'none'} />
                            {isFavorite ? tItem('unfavorite') : tItem('favorite')}
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            {actions.playlist && (
                <AddToPlaylistDialog
                    open={playlistDialogOpen}
                    onOpenChange={handlePlaylistDialogOpenChange}
                    itemIds={playlistDialogItemIds}
                />
            )}
        </>
    );
};

export default MusicItemContextMenu;
