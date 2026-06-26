import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { ReactNode } from 'react';
import ItemsGridPage, { type ItemsQueryParams, type ItemsQueryResult } from './ItemsGridPage';
import { useItemsGridState } from '@/hooks/useItemsGridState';

export type { ItemsQueryParams, ItemsQueryResult };

/**
 * Hook signature expected by ItemsListPage.
 * e.g. useGenreItems(id, params) or useStudioItems(id, params)
 */
export type UseItemsHook = (id: string, params: ItemsQueryParams) => ItemsQueryResult;

export interface ItemsListPageProps {
    /** The parent item (genre, studio, etc.) — used for id + title */
    item: BaseItemDto;
    /** The hook used to fetch children for this item */
    useItems: UseItemsHook;
    /** Poster aspect ratio class for grid items */
    itemAspectClass?: string;
    /** Override the list heading (defaults to item name) */
    listTitle?: string;
    /** Optional render prop to overlay something on each poster (e.g. WatchedStateBadge) */
    renderItemOverlay?: (item: BaseItemDto) => ReactNode;
    /** Override the default /item/:id link for each item */
    getItemUrl?: (item: BaseItemDto) => string;
}

/** Items belonging to a single parent item (genre, studio, ...). */
const ItemsListPage = ({
    item,
    useItems,
    itemAspectClass,
    listTitle,
    renderItemOverlay,
    getItemUrl,
}: ItemsListPageProps) => {
    const state = useItemsGridState();
    const result = useItems(item.Id!, state.params);

    return (
        <ItemsGridPage
            title={listTitle ?? item.Name ?? undefined}
            state={state}
            result={result}
            itemAspectClass={itemAspectClass}
            renderItemOverlay={renderItemOverlay}
            getItemUrl={getItemUrl}
        />
    );
};

export default ItemsListPage;
