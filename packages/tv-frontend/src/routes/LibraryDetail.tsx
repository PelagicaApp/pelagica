import { useEffect, useRef, useState } from 'react';
import { useParams } from '@/router';
import { useTranslation } from 'react-i18next';
import {
    getLibraryItemsOptions,
    getUserId,
    useItem,
    useLibraryItems,
    useUserViews,
} from '@pelagica/core';
import ItemPagination from '../components/ItemPagination';
import ItemCardGrid from '../components/ItemCardGrid';

const MIN_CARD_WIDTH = 160;
const GRID_GAP = 16;
const ROWS_PER_PAGE = 5;

const LibraryDetail = () => {
    const { libraryId } = useParams<{ libraryId: string }>();
    const { t } = useTranslation(['library', 'item']);
    const { data: views, isLoading: areViewsLoading, error: viewsError } = useUserViews();
    const view = views?.Items?.find((entry) => entry.Id === libraryId);
    const {
        data: container,
        isLoading: isContainerLoading,
        error: containerError,
    } = useItem(!areViewsLoading && !view ? libraryId : undefined, true, getUserId() ?? undefined);
    const library = view ?? container;
    const gridRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);
    const [page, setPage] = useState(0);

    useEffect(() => {
        setPage(0);
    }, [libraryId]);

    useEffect(() => {
        if (!gridRef.current) return;
        const observer = new ResizeObserver(([entry]) => {
            const width = entry.contentRect.width;
            setColumns(Math.max(1, Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP))));
        });

        observer.observe(gridRef.current);
        return () => observer.disconnect();
    }, []);

    const pageSize = columns * ROWS_PER_PAGE;

    const {
        data,
        isLoading: areItemsLoading,
        error: itemsError,
    } = useLibraryItems(library ? libraryId : undefined, {
        ...getLibraryItemsOptions(library?.CollectionType),
        limit: pageSize,
        startIndex: page * pageSize,
        sortBy: ['DateCreated'],
        sortOrder: 'Descending',
    });
    const isLoading = areViewsLoading || isContainerLoading || areItemsLoading;

    const totalPages = data?.totalCount ? Math.ceil(data.totalCount / pageSize) : 0;

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">{library?.Name ?? t('title')}</h1>
            {(viewsError || containerError || itemsError) && (
                <p role="alert" className="text-muted-foreground">
                    {t('item:item_not_found')}
                </p>
            )}
            <ItemCardGrid ref={gridRef} items={data?.items} isLoading={isLoading} autoFocusFirst />
            {!isLoading && data?.items.length === 0 && (
                <p className="text-muted-foreground">{t('no_items_description')}</p>
            )}
            <ItemPagination
                totalPages={totalPages}
                currentPage={page}
                onPageChange={(newPage) => setPage(newPage)}
            />
        </div>
    );
};

export default LibraryDetail;
