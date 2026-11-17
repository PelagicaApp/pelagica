import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddToPlaylist, useCreatePlaylist, useCurrentUser } from '@pelagica/core';
import type { PlaylistMediaType } from '@/utils/playlistMediaType';

interface NewPlaylistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mediaType: PlaylistMediaType;
    itemIds: string[];
}

export function NewPlaylistDialog({
    open,
    onOpenChange,
    mediaType,
    itemIds,
}: NewPlaylistDialogProps) {
    const { t } = useTranslation('item');
    const { t: tMusic } = useTranslation('music');
    const { data: currentUser } = useCurrentUser();
    const createPlaylist = useCreatePlaylist();
    const addToPlaylist = useAddToPlaylist();
    const [name, setName] = useState('');

    const isBusy = createPlaylist.isPending || addToPlaylist.isPending;

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) setName('');
        onOpenChange(nextOpen);
    };

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed || isBusy) return;

        try {
            const created = await createPlaylist.mutateAsync({
                name: trimmed,
                userId: currentUser?.Id ?? undefined,
                mediaType,
            });
            if (created.Id && itemIds.length > 0) {
                await addToPlaylist.mutateAsync({
                    playlistId: created.Id,
                    itemIds,
                    userId: currentUser?.Id ?? undefined,
                });
            }
            handleOpenChange(false);
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('create_playlist')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Input
                        placeholder={t('playlist_name')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                        autoFocus
                        disabled={isBusy}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isBusy}
                        >
                            {t('cancel')}
                        </Button>
                        <Button onClick={handleCreate} disabled={!name.trim() || isBusy}>
                            {isBusy && <Loader2 className="animate-spin" />}
                            {itemIds.length > 0 ? tMusic('create_and_add') : t('create')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
