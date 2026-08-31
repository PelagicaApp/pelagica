import { memo, useState, type ReactNode } from 'react';
import { getPrimaryImageUrl, getThumbUrl } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useTranslation } from 'react-i18next';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_RING_LARGE } from '@/lib/focus-styles';
import FocusableCard from './FocusableCard';
import { getItemLink } from '../lib/getItemLink';

const ItemCard = memo(function ItemCard({
    item,
    autoFocus,
    className,
    useThumb,
    detail,
}: {
    item: BaseItemDto;
    autoFocus?: boolean;
    className?: string;
    useThumb?: boolean;
    detail?: ReactNode;
}) {
    const { t } = useTranslation('item');
    const [imageError, setImageError] = useState(false);

    const showThumb = useThumb && !!item.ImageTags?.Thumb;
    const imageSrc = item.Id
        ? showThumb
            ? getThumbUrl(item.Id, { width: 640 }, item.ImageTags?.Thumb)
            : getPrimaryImageUrl(item.Id, { width: 320 })
        : undefined;

    return (
        <FocusableCard
            to={getItemLink(item.Type, item.Id)}
            autoFocus={autoFocus}
            className={cn(showThumb ? 'w-60' : 'w-40', className)}
        >
            {(focused) => (
                <>
                    <div
                        className={cn(
                            showThumb ? 'aspect-video' : 'aspect-2/3',
                            'w-full overflow-hidden rounded-md border border-border bg-muted',
                            focused && FOCUS_RING_LARGE
                        )}
                    >
                        {imageError || !imageSrc ? (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : (
                            <img
                                src={imageSrc}
                                alt={item.Name || t('unknown_item')}
                                className="h-full w-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        )}
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{item.Name}</p>
                    {detail ? (
                        detail
                    ) : (
                        <p className="text-xs text-muted-foreground">{item.ProductionYear}</p>
                    )}
                </>
            )}
        </FocusableCard>
    );
});

export default ItemCard;
