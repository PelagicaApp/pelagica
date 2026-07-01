import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ListMusic, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { usePlaylists } from '@/hooks/api/playlist/usePlaylists';
import { useAddToPlaylist } from '@/hooks/api/playlist/useAddToPlaylist';
import { useCreatePlaylist } from '@/hooks/api/playlist/useCreatePlaylist';

interface AddToPlaylistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemIds: string[];
}

export function AddToPlaylistDialog({ open, onOpenChange, itemIds }: AddToPlaylistDialogProps) {
    const { t } = useTranslation('item');
    const { t: tMusic } = useTranslation('music');
    const { data: currentUser } = useCurrentUser();
    const {
        data: playlists,
        isLoading: isLoadingPlaylists,
        refetch,
    } = usePlaylists(currentUser?.Id);
    const addToPlaylist = useAddToPlaylist();
    const createPlaylist = useCreatePlaylist();

    const [showCreate, setShowCreate] = useState(false);
    const [playlistName, setPlaylistName] = useState('');
    const [addingToId, setAddingToId] = useState<string | null>(null);
    const [addedToId, setAddedToId] = useState<string | null>(null);

    const resetForm = () => {
        setShowCreate(false);
        setPlaylistName('');
        setAddingToId(null);
        setAddedToId(null);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetForm();
        }
        onOpenChange(nextOpen);
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        if (itemIds.length === 0 || addingToId) return;

        setAddingToId(playlistId);
        try {
            await addToPlaylist.mutateAsync({
                playlistId,
                itemIds,
                userId: currentUser?.Id,
            });
            setAddedToId(playlistId);
            setTimeout(() => handleOpenChange(false), 400);
        } catch (error) {
            console.error('Error adding to playlist:', error);
        } finally {
            setAddingToId(null);
        }
    };

    const handleCreateAndAdd = async () => {
        const name = playlistName.trim();
        if (!name || itemIds.length === 0) return;

        try {
            const created = await createPlaylist.mutateAsync({
                name,
                userId: currentUser?.Id,
            });
            if (created.Id) {
                await addToPlaylist.mutateAsync({
                    playlistId: created.Id,
                    itemIds,
                    userId: currentUser?.Id,
                });
            }
            setPlaylistName('');
            setShowCreate(false);
            await refetch();
            handleOpenChange(false);
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    };

    const handleCreateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCreateAndAdd();
        }
    };

    const isBusy = addToPlaylist.isPending || createPlaylist.isPending;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle>{t('add_to_playlist')}</DialogTitle>
                </DialogHeader>

                <Command className="rounded-none border-t">
                    <CommandInput placeholder={tMusic('search_playlists')} />
                    <CommandList className="max-h-56">
                        {isLoadingPlaylists ? (
                            <div className="flex flex-col gap-2 p-3">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-9 w-full rounded-md" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>{tMusic('no_playlists_found')}</CommandEmpty>
                                {playlists?.map((playlist) => {
                                    const id = playlist.Id!;
                                    const isAdding = addingToId === id;
                                    const wasAdded = addedToId === id;

                                    return (
                                        <CommandItem
                                            key={id}
                                            value={playlist.Name || tMusic('untitled')}
                                            disabled={isBusy || itemIds.length === 0}
                                            onSelect={() => handleAddToPlaylist(id)}
                                            className="gap-3"
                                        >
                                            <ListMusic className="size-4 shrink-0 text-muted-foreground" />
                                            <span className="flex-1 truncate">
                                                {playlist.Name || tMusic('untitled')}
                                            </span>
                                            {playlist.ChildCount !== undefined && (
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {tMusic('tracks_count', {
                                                        count: playlist.ChildCount,
                                                    })}
                                                </span>
                                            )}
                                            {isAdding && (
                                                <Loader2 className="size-4 shrink-0 animate-spin" />
                                            )}
                                            {wasAdded && (
                                                <Check className="size-4 shrink-0 text-green-500" />
                                            )}
                                        </CommandItem>
                                    );
                                })}
                            </>
                        )}
                    </CommandList>
                </Command>

                <div className="border-t p-4">
                    {!showCreate ? (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowCreate(true)}
                            disabled={itemIds.length === 0}
                        >
                            <Plus />
                            {t('new_playlist')}
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium">{t('create_playlist')}</p>
                            <Input
                                placeholder={t('playlist_name')}
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                onKeyDown={handleCreateKeyDown}
                                autoFocus
                                disabled={isBusy}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowCreate(false);
                                        setPlaylistName('');
                                    }}
                                    disabled={isBusy}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleCreateAndAdd}
                                    disabled={
                                        !playlistName.trim() || isBusy || itemIds.length === 0
                                    }
                                >
                                    {createPlaylist.isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : null}
                                    {tMusic('create_and_add')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
