import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import ItemCard from './ItemCard';
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';

const ItemCardSkeleton = () => (
    <div className="w-40 shrink-0">
        <div className="aspect-2/3 w-full animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3 w-1/3 animate-pulse rounded bg-muted" />
    </div>
);

const ItemRow = ({
    title,
    items,
    isLoading = false,
}: {
    title: string;
    items?: BaseItemDto[];
    isLoading?: boolean;
}) => {
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
        focusable: !isLoading && (items?.length ?? 0) > 0,
        saveLastFocusedChild: true,
    });

    const skeletonCount = 6;

    if (!isLoading && (items?.length ?? 0) === 0) return null;

    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>

            <FocusContext.Provider value={focusKey}>
                <div className="scrollbar-hide flex gap-4 overflow-x-auto p-3" ref={ref}>
                    {isLoading
                        ? Array.from({ length: skeletonCount }).map((_, index) => (
                              <ItemCardSkeleton key={index} />
                          ))
                        : items?.map((item) => <ItemCard key={item.Id} item={item} />)}
                </div>
            </FocusContext.Provider>
        </div>
    );
};

export default ItemRow;
