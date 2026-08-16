import { useRefreshItemMetadata } from '@pelagica/core';
import { MetadataRefreshMode, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type RefreshType = 'scan' | 'search' | 'replace';

const RefreshItemMetadataButton = ({
    item,
    trigger,
}: {
    item: BaseItemDto;
    trigger: React.ReactNode;
}) => {
    const { t } = useTranslation('item');
    const [isRefreshDialogOpen, setIsRefreshDialogOpen] = useState(false);
    const [refreshType, setRefreshType] = useState<RefreshType>('scan');
    const [replaceExistingImages, setReplaceExistingImages] = useState(false);
    const [replaceExistingTrickplay, setReplaceExistingTrickplay] = useState(false);

    const { refreshItemMetadata, isRefreshing } = useRefreshItemMetadata(() => {
        setIsRefreshDialogOpen(false);
    });

    const handleRefreshMetadata = () => {
        if (!item.Id) return;

        let metadataRefreshMode: MetadataRefreshMode;
        let imageRefreshMode: MetadataRefreshMode;
        let replaceAllMetadata = false;

        switch (refreshType) {
            case 'scan':
                metadataRefreshMode = MetadataRefreshMode.Default;
                imageRefreshMode = MetadataRefreshMode.Default;
                break;
            case 'search':
                metadataRefreshMode = MetadataRefreshMode.FullRefresh;
                imageRefreshMode = MetadataRefreshMode.FullRefresh;
                break;
            case 'replace':
                metadataRefreshMode = MetadataRefreshMode.FullRefresh;
                imageRefreshMode = MetadataRefreshMode.FullRefresh;
                replaceAllMetadata = true;
                break;
        }

        refreshItemMetadata({
            itemId: item.Id,
            metadataRefreshMode,
            imageRefreshMode,
            replaceAllMetadata,
            replaceAllImages: replaceExistingImages,
            regenerateTrickplay: replaceExistingTrickplay,
        });
    };

    return (
        <Dialog open={isRefreshDialogOpen} onOpenChange={setIsRefreshDialogOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('refresh_metadata_title')}</DialogTitle>
                    <DialogDescription>{t('refresh_metadata_description')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">{t('refresh_type')}</label>
                        <Select
                            value={refreshType}
                            onValueChange={(value) => setRefreshType(value as RefreshType)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={'scan'}>{t('scan_for_new')}</SelectItem>
                                <SelectItem value={'search'}>{t('search_for_missing')}</SelectItem>
                                <SelectItem value={'replace'}>
                                    {t('replace_all_metadata')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label
                            className={
                                'flex items-center gap-2 ' +
                                (refreshType === 'scan'
                                    ? 'text-muted-foreground cursor-not-allowed'
                                    : '')
                            }
                        >
                            <Checkbox
                                checked={replaceExistingImages}
                                onCheckedChange={(checked) => setReplaceExistingImages(!!checked)}
                                className="h-4 w-4"
                                disabled={refreshType === 'scan'}
                            />
                            <span className="text-sm font-medium">
                                {t('replace_existing_images')}
                            </span>
                        </label>
                        <label
                            className={
                                'flex items-center gap-2 ' +
                                (refreshType === 'scan'
                                    ? 'text-muted-foreground cursor-not-allowed'
                                    : '')
                            }
                        >
                            <Checkbox
                                checked={replaceExistingTrickplay}
                                onCheckedChange={(checked) =>
                                    setReplaceExistingTrickplay(!!checked)
                                }
                                className="h-4 w-4"
                                disabled={refreshType === 'scan'}
                            />
                            <span className="text-sm font-medium">
                                {t('replace_existing_trickplay')}
                            </span>
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant={'outline'} onClick={() => setIsRefreshDialogOpen(false)}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleRefreshMetadata} disabled={!item.Id || isRefreshing}>
                        {isRefreshing ? t('refreshing') : t('refresh')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RefreshItemMetadataButton;
