import { memo } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import ItemCard from './ItemCard';

interface ItemCardGridProps {
    ref?: React.Ref<HTMLDivElement>;
    items?: BaseItemDto[];
    isLoading?: boolean;
    autoFocusFirst?: boolean;
    className?: string;
}

const ItemCardGrid = memo(function ItemCardGrid({
    ref,
    items,
    isLoading,
    autoFocusFirst,
    className,
}: ItemCardGridProps) {
    if ((!items || items.length === 0) && !isLoading) return null;

    return (
        <div
            ref={ref}
            className={`grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4 ${className}`}
        >
            {isLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                      <div
                          key={i}
                          className="aspect-2/3 w-full animate-pulse rounded-md bg-muted"
                      />
                  ))
                : items?.map((item, i) => (
                      <ItemCard
                          key={item.Id}
                          item={item}
                          autoFocus={autoFocusFirst && i === 0}
                          className="w-full"
                      />
                  ))}
        </div>
    );
});

export default ItemCardGrid;
