import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getDownloadurl } from '@pelagica/core';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface ItemDownloadButtonProps {
    item: BaseItemDto;
    showDownloadButton?: boolean | undefined;
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | null | undefined;
    variant?:
        | 'default'
        | 'link'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | null
        | undefined;
}

const ItemDownloadButton = ({
    item,
    showDownloadButton,
    size = 'icon',
    variant = 'outline',
}: ItemDownloadButtonProps) => {
    if (showDownloadButton === false) return null;

    return (
        <Button variant={variant} size={size} asChild>
            <a href={getDownloadurl(item.Id || '')} target="_blank" rel="noopener noreferrer">
                <Download />
            </a>
        </Button>
    );
};

export default ItemDownloadButton;
