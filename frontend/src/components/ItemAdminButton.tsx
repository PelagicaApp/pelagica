import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Captions, EllipsisVertical, Image, RotateCcw, Trash2, PencilLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { useRef } from 'react';
import { useAdminItemDialogs } from '../context/AdminItemDialogsContext';
import SubtitleDownloadDialog from '../pages/Item/SubtitleDownloadDialog';

const ItemAdminButton = ({
    item,
    showSubtitlesButton = false,
}: {
    item: BaseItemDto;
    showSubtitlesButton?: boolean;
}) => {
    const { t } = useTranslation('item');
    const { data: currentUser } = useCurrentUser();
    const { openDialog } = useAdminItemDialogs();
    const subtitlesTriggerRef = useRef<HTMLButtonElement>(null);

    if (currentUser?.Policy?.IsAdministrator !== true) return null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={'outline'} size={'icon'}>
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={'end'}>
                    {showSubtitlesButton && (
                        <DropdownMenuItem
                            onClick={() => {
                                setTimeout(() => subtitlesTriggerRef.current?.click(), 0);
                            }}
                        >
                            <Captions />
                            {t('subtitles')}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openDialog(item, 'manageImages')}>
                        <Image />
                        {t('manage_images')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDialog(item, 'refreshMetadata')}>
                        <RotateCcw />
                        {t('refreshMetadata')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDialog(item, 'editMetadata')}>
                        <PencilLine />
                        {t('editMetadata')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDialog(item, 'delete')}>
                        <Trash2 />
                        {t('deleteItem')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div style={{ display: 'none' }}>
                <SubtitleDownloadDialog
                    item={item}
                    trigger={<button ref={subtitlesTriggerRef} />}
                />
            </div>
        </>
    );
};

export default ItemAdminButton;
