import type { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

const ITEM_ROWS = 5;
const DEFAULT_SORT_BY: ItemSortBy = 'Name';
const DEFAULT_SORT_ORDER: SortOrder = 'Ascending';

function getColumnCount(width: number): number {
    if (width >= 1536) return 9; // 2xl
    if (width >= 1280) return 7; // xl
    if (width >= 1024) return 5; // lg
    if (width >= 768) return 4; // md
    if (width >= 640) return 3; // sm
    return 2;
}

export interface ItemsQueryParams {
    sortBy: ItemSortBy[];
    sortOrder: SortOrder[];
    limit: number;
    startIndex: number;
}

export interface ItemsQueryResult {
    data:
        | {
              items?: BaseItemDto[] | null;
              totalCount?: number | null;
          }
        | undefined;
    isLoading: boolean;
    error: unknown;
}

export interface ItemsGridState {
    params: ItemsQueryParams;
    page: number;
    sortBy: ItemSortBy;
    sortOrder: SortOrder;
    pageSize: number;
    setPage: (page: number) => void;
    setSortBy: (sortBy: ItemSortBy) => void;
    setSortOrder: (sortOrder: SortOrder) => void;
}

export function useItemsGridState(defaults?: {
    sortBy?: ItemSortBy;
    sortOrder?: SortOrder;
}): ItemsGridState {
    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseInt(searchParams.get('page') ?? '0', 10);
    const sortByParam =
        (searchParams.get('sortBy') as ItemSortBy) || defaults?.sortBy || DEFAULT_SORT_BY;
    const sortOrderParam =
        (searchParams.get('sortOrder') as SortOrder) || defaults?.sortOrder || DEFAULT_SORT_ORDER;
    const [page, setPageState] = useState<number>(Number.isNaN(pageParam) ? 0 : pageParam);
    const [sortBy, setSortByState] = useState<ItemSortBy>(sortByParam);
    const [sortOrder, setSortOrderState] = useState<SortOrder>(sortOrderParam);
    const [pageSize, setPageSize] = useState(
        () => getColumnCount(typeof window !== 'undefined' ? window.innerWidth : 640) * ITEM_ROWS
    );

    const updateSearchParams = (
        nextPage: number,
        nextSortBy = sortBy,
        nextSortOrder = sortOrder
    ) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('page', String(nextPage));
            next.set('sortBy', nextSortBy);
            next.set('sortOrder', nextSortOrder);
            return next;
        });
    };

    useEffect(() => {
        const handleResize = () => {
            const newPageSize = getColumnCount(window.innerWidth) * ITEM_ROWS;
            setPageSize(newPageSize);
            setPageState(0);
            updateSearchParams(0);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        params: {
            sortBy: [sortBy],
            sortOrder: [sortOrder],
            limit: pageSize,
            startIndex: page * pageSize,
        },
        page,
        sortBy,
        sortOrder,
        pageSize,
        setPage: (newPage) => {
            setPageState(newPage);
            updateSearchParams(newPage);
        },
        setSortBy: (newSortBy) => {
            setSortByState(newSortBy);
            setPageState(0);
            updateSearchParams(0, newSortBy, sortOrder);
        },
        setSortOrder: (newSortOrder) => {
            setSortOrderState(newSortOrder);
            setPageState(0);
            updateSearchParams(0, sortBy, newSortOrder);
        },
    };
}
