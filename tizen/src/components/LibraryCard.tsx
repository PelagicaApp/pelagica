import { useState } from 'react';
import { getPrimaryImageUrl } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useTranslation } from 'react-i18next';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_RING_LARGE } from '@/lib/focus-styles';
import FocusableCard from './FocusableCard';

const LibraryCard = ({
    item,
    autoFocus,
    className,
}: {
    item: BaseItemDto;
    autoFocus?: boolean;
    className?: string;
}) => {
    const { t } = useTranslation('item');
    const [imageError, setImageError] = useState(false);

    return (
        <FocusableCard
            to={`/library/${item.Id}`}
            autoFocus={autoFocus}
            className={cn('w-60', className)}
        >
            {(focused) => (
                <>
                    <div
                        className={cn(
                            'aspect-video w-full overflow-hidden rounded-md border border-border bg-muted',
                            focused && FOCUS_RING_LARGE
                        )}
                    >
                        {imageError || !item.Id ? (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : (
                            <img
                                src={getPrimaryImageUrl(item.Id, { width: 448 })}
                                alt={item.Name || t('unknown_library')}
                                className="h-full w-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        )}
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{item.Name}</p>
                </>
            )}
        </FocusableCard>
    );
};

export default LibraryCard;
