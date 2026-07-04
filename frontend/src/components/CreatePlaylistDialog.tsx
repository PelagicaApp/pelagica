import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePlaylist } from '@/hooks/api/playlist/useCreatePlaylist';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';

interface CreatePlaylistDialogProps {
    userId?: string;
    onSuccess?: () => void;
    menuVariant?: 'dropdown' | 'context';
}

export function CreatePlaylistDialog({
    userId,
    onSuccess,
    menuVariant = 'dropdown',
}: CreatePlaylistDialogProps) {
    const { t } = useTranslation('item');
    const createPlaylist = useCreatePlaylist();
    const [playlistName, setPlaylistName] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleCreate = async () => {
        if (!playlistName.trim()) return;

        try {
            await createPlaylist.mutateAsync({
                name: playlistName,
                userId,
            });
            setPlaylistName('');
            setIsOpen(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCreate();
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const MenuItem = menuVariant === 'context' ? ContextMenuItem : DropdownMenuItem;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <MenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus /> {t('new_playlist')}
                </MenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('create_playlist')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Input
                        placeholder={t('playlist_name')}
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!playlistName.trim() || createPlaylist.isPending}
                        >
                            {t('create')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
