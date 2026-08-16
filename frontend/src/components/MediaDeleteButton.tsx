import { useDeleteMedia } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { useCurrentUser } from '@pelagica/core';

const MediaDeleteButton = ({
    item,
    trigger,
    deleteButton,
}: {
    item: BaseItemDto;
    trigger?: React.ReactNode;
    deleteButton?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: currentUser } = useCurrentUser();
    const navigate = useNavigate();
    const { deleteMedia, isDeleting } = useDeleteMedia(() => {
        navigate('/');
    });
    const { t } = useTranslation('item');

    const handleDelete = () => {
        deleteMedia(item.Id!);
    };

    if (deleteButton === false) return null;

    if (currentUser?.Policy?.IsAdministrator !== true) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button variant={'outline'} size={'icon'}>
                        <Trash2 />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('media_delete_confirm_title')}</DialogTitle>
                </DialogHeader>
                <p className="mb-4">{t('media_delete_confirm', { title: item.Name })}</p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant={'outline'}
                        disabled={isDeleting}
                        onClick={() => setIsOpen(false)}
                    >
                        {t('cancel')}
                    </Button>
                    <Button variant={'destructive'} disabled={isDeleting} onClick={handleDelete}>
                        {isDeleting ? t('deleting') : t('delete')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MediaDeleteButton;
