import { Skeleton } from '@/components/ui/skeleton';
import { getPrimaryImageUrl, type ImageSize } from '@/utils/jellyfinUrls';
import type { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import {
    ArrowDownWideNarrow,
    ArrowUpNarrowWideIcon,
    Calendar,
    CalendarPlus,
    CaseSensitive,
    Clock,
    Star,
    ImageOff,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import ItemPagination from '@/components/ItemPagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ButtonGroup } from '@/components/ui/button-group';

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

function getItemsLayout(width: number) {
    const columnCount = getColumnCount(width);
    return {
        columnCount,
        pageSize: columnCount * ITEM_ROWS,
    };
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

/**
 * Hook signature expected by ItemsListPage.
 * e.g. useGenreItems(id, params) or useStudioItems(id, params)
 */
export type UseItemsHook = (id: string, params: ItemsQueryParams) => ItemsQueryResult;

interface ItemDisplayProps {
    item: BaseItemDto;
    aspectClass: string;
    /** Optional overlay, e.g. a WatchedStateBadge */
    overlay?: ReactNode;
    /** Override the default /item/:id link */
    linkUrl?: string;
}

const ItemDisplay = ({ item, aspectClass, overlay, linkUrl }: ItemDisplayProps) => {
    const { t } = useTranslation('item');
    const [posterError, setPosterError] = useState(false);

    const imageSize: ImageSize =
        aspectClass === 'aspect-square'
            ? {
                  width: 300,
                  height: 300,
              }
            : {
                  width: 300,
                  height: 450,
              };

    const posterUrl = getPrimaryImageUrl(item.Id!, imageSize, item.ImageTags?.Primary);

    return (
        <Link to={linkUrl ?? `/item/${item.Id}`} key={item.Id} className="p-0 m-0">
            <div className={`relative w-full ${aspectClass} overflow-hidden rounded-md group`}>
                {!posterError ? (
                    <>
                        <img
                            key={item.Id}
                            src={posterUrl}
                            alt={item.Name || t('library:no_title')}
                            className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105 z-10"
                            loading="lazy"
                            onError={() => setPosterError(true)}
                        />
                        <Skeleton className="absolute bottom-0 left-0 right-0 top-0 -z-1" />
                    </>
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="text-4xl text-muted-foreground" />
                    </div>
                )}
                {overlay}
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
            </div>
            <p className="mt-2 text-sm line-clamp-1 text-ellipsis break-all">
                {item.Name || t('library:no_title')}
            </p>
            {item.PremiereDate && (
                <span className="text-xs text-muted-foreground line-clamp-1">
                    {new Date(item.PremiereDate).getFullYear()}
                </span>
            )}
        </Link>
    );
};

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

const ItemsListPage = ({
    item,
    useItems,
    itemAspectClass = 'aspect-2/3',
    listTitle,
    renderItemOverlay,
    getItemUrl,
}: ItemsListPageProps) => {
    const { t } = useTranslation(['item', 'library']);
    const pageRef = useRef<HTMLDivElement>(null);
    const scrollAfterLoadRef = useRef(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseInt(searchParams.get('page') ?? '0', 10);
    const sortByParam = (searchParams.get('sortBy') as ItemSortBy) || DEFAULT_SORT_BY;
    const sortOrderParam = (searchParams.get('sortOrder') as SortOrder) || DEFAULT_SORT_ORDER;
    const [page, setPage] = useState<number>(Number.isNaN(pageParam) ? 0 : pageParam);
    const [sortBy, setSortBy] = useState<ItemSortBy>(sortByParam);
    const [sortOrder, setSortOrder] = useState<SortOrder>(sortOrderParam);
    const [contentWidth, setContentWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : 640
    );
    const { columnCount, pageSize } = useMemo(() => getItemsLayout(contentWidth), [contentWidth]);
    const previousPageSizeRef = useRef(pageSize);

    const updateSearchParams = useCallback(
        (nextPage: number, nextSortBy = sortBy, nextSortOrder = sortOrder) => {
            const next = new URLSearchParams(searchParams);
            next.set('page', String(nextPage));
            next.set('sortBy', nextSortBy);
            next.set('sortOrder', nextSortOrder);
            setSearchParams(next);
        },
        [searchParams, setSearchParams, sortBy, sortOrder]
    );

    useEffect(() => {
        const pageElement = pageRef.current;
        if (!pageElement) return;

        const updateContentWidth = (width: number) => {
            setContentWidth(Math.max(0, Math.floor(width)));
        };

        updateContentWidth(pageElement.getBoundingClientRect().width);

        const resizeObserver = new ResizeObserver(([entry]) => {
            updateContentWidth(entry.contentRect.width);
        });

        resizeObserver.observe(pageElement);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (previousPageSizeRef.current === pageSize) return;
        previousPageSizeRef.current = pageSize;
        setPage(0);
        updateSearchParams(0);
    }, [pageSize, updateSearchParams]);

    const {
        data: items,
        isLoading: loadingItems,
        error,
    } = useItems(item.Id!, {
        sortBy: [sortBy],
        sortOrder: [sortOrder],
        limit: pageSize,
        startIndex: page * pageSize,
    });

    useEffect(() => {
        if (!scrollAfterLoadRef.current) return;
        if (pageRef.current && !loadingItems && items?.items?.length) {
            pageRef.current.scrollIntoView({ block: 'start' });
            scrollAfterLoadRef.current = false;
        }
    }, [items?.items, loadingItems]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        updateSearchParams(newPage);
        scrollAfterLoadRef.current = true;
    };

    const handleSortChange = (newSortBy: ItemSortBy) => {
        setSortBy(newSortBy);
        setPage(0);
        updateSearchParams(0, newSortBy, sortOrder);
        scrollAfterLoadRef.current = true;
    };

    const handleSortOrderChange = (newSortOrder: SortOrder) => {
        setSortOrder(newSortOrder);
        setPage(0);
        updateSearchParams(0, sortBy, newSortOrder);
        scrollAfterLoadRef.current = true;
    };

    const totalPages = items?.totalCount ? Math.ceil(items.totalCount / pageSize) : 0;
    const gridStyle = { gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` };

    return (
        <div ref={pageRef}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold">{listTitle ?? item.Name}</h2>
                <ButtonGroup>
                    <Select onValueChange={handleSortChange} value={sortBy}>
                        <SelectTrigger size="sm">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Name">
                                <CaseSensitive />
                                {t('library:sort_name')}
                            </SelectItem>
                            <SelectItem value="DateCreated">
                                <CalendarPlus />
                                {t('library:sort_date_added')}
                            </SelectItem>
                            <SelectItem value="PremiereDate">
                                <Calendar />
                                {t('library:sort_premiere_date')}
                            </SelectItem>
                            <SelectItem value="CommunityRating">
                                <Star />
                                {t('library:sort_community_rating')}
                            </SelectItem>
                            <SelectItem value="Runtime">
                                <Clock />
                                {t('library:sort_runtime')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={handleSortOrderChange} value={sortOrder}>
                        <SelectTrigger size="sm">
                            <SelectValue placeholder="Order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Ascending">
                                <ArrowUpNarrowWideIcon />
                                {t('library:ascending')}
                            </SelectItem>
                            <SelectItem value="Descending">
                                <ArrowDownWideNarrow />
                                {t('library:descending')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </ButtonGroup>
            </div>

            {loadingItems && (
                <div className="mt-2 grid w-full gap-4" style={gridStyle}>
                    {Array.from({ length: pageSize }).map((_, i) => (
                        <div key={i} className="p-0 m-0">
                            <div
                                className={`relative w-full ${itemAspectClass} overflow-hidden rounded-md`}
                            >
                                <Skeleton className="w-full h-full" />
                            </div>
                            <Skeleton className="mt-2 h-4 w-3/4" />
                            <Skeleton className="mt-1 h-3 w-1/4" />
                        </div>
                    ))}
                </div>
            )}

            {!!error && (
                <p className="text-red-500">
                    Error loading items: {error instanceof Error ? error.message : String(error)}
                </p>
            )}

            {!loadingItems && !error && items && (
                <>
                    <ul className="grid w-full gap-4" style={gridStyle}>
                        {items?.items?.map((child) => (
                            <ItemDisplay
                                key={child.Id}
                                item={child}
                                aspectClass={itemAspectClass}
                                overlay={renderItemOverlay?.(child)}
                                linkUrl={getItemUrl?.(child)}
                            />
                        ))}
                    </ul>
                    <ItemPagination
                        totalPages={totalPages}
                        currentPage={page}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    );
};

export default ItemsListPage;
