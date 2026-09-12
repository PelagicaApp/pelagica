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
import ItemRow from './ItemRow';

interface CollectionRowProps {
    collection: BaseItemDto;
    sort: CollectionSortOption;
}

const CollectionRow: React.FC<CollectionRowProps> = memo(({ collection, sort }) => {
    const { data: items, isLoading } = useBoxSetItems(collection.Id);

    const sortedItems = useMemo(() => sortCollectionItems(items || [], sort), [items, sort]);

    return (
        <ItemRow
            title={collection.Name ?? 'Unknown Collection'}
            items={sortedItems}
            isLoading={isLoading}
        />
    );
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
