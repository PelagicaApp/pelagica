import ScrollableSectionPoster from '@/components/ScrollableSectionPoster';
import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import {
    sortCollectionItems,
    useBoxSetItems,
    useItemCollections,
    type AppConfig,
    type CollectionSortOption,
} from '@pelagica/core';
import { memo, useMemo } from 'react';
import type React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import GeneralItemContextMenu from '../../components/GeneraItemContextMenu';

const skeletonItems = Array.from({ length: 5 }, (_, index) => (
    <div key={index} className="w-36 lg:w-44 2xl:w-52">
        <Skeleton className="w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80 rounded-md mb-2" />
        <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-1" />
        <Skeleton className="w-20 lg:w-24 2xl:w-28 h-3" />
    </div>
));

interface CollectionRowProps {
    collection: BaseItemDto;
    sort: CollectionSortOption;
}

const CollectionRow: React.FC<CollectionRowProps> = memo(({ collection, sort }) => {
    const { data: items, isLoading } = useBoxSetItems(collection.Id);

    const sortedItems = useMemo(() => sortCollectionItems(items || [], sort), [items, sort]);

    const itemElements = useMemo(() => {
        return sortedItems.map((item) => (
            <GeneralItemContextMenu key={item.Id} item={item}>
                <ScrollableSectionPoster item={item}>
                    {item.PremiereDate && (
                        <span className="text-xs text-muted-foreground mt-1">
                            {new Date(item.PremiereDate).getFullYear()}
                        </span>
                    )}
                </ScrollableSectionPoster>
            </GeneralItemContextMenu>
        ));
    }, [sortedItems]);

    const title = (
        <Link
            to={`/item/${collection.Id}`}
            className="flex items-center gap-1 group cursor-pointer w-fit transition-colors"
        >
            <h3 className="text-3xl font-bold">{collection.Name}</h3>
            <ChevronRight className="w-7 h-7 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Link>
    );

    if (isLoading) {
        return <SectionScroller title={title} items={skeletonItems} />;
    }

    if (itemElements.length === 0) {
        return null;
    }

    return <SectionScroller title={title} items={itemElements} />;
});

CollectionRow.displayName = 'CollectionRow';

interface CollectionRowsProps {
    itemId: string;
    config: AppConfig;
}

const CollectionRows: React.FC<CollectionRowsProps> = memo(({ itemId, config }) => {
    const showCollections = config.itemPage?.showCollections !== false;
    const { data: collections } = useItemCollections(itemId, showCollections);

    if (!showCollections || !collections || collections.length === 0) {
        return null;
    }

    const sort = config.itemPage?.collectionSort || 'PremiereDateAsc';

    return (
        <>
            {collections.map((collection) => (
                <CollectionRow key={collection.Id} collection={collection} sort={sort} />
            ))}
        </>
    );
});

CollectionRows.displayName = 'CollectionRows';

export default CollectionRows;
