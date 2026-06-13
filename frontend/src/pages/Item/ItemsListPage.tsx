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
import { type ReactNode, useEffect, useState } from 'react';
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
}

const ItemDisplay = ({ item, aspectClass, overlay }: ItemDisplayProps) => {
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
        <Link to={`/item/${item.Id}`} key={item.Id} className="p-0 m-0">
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
}

const ItemsListPage = ({
    item,
    useItems,
    itemAspectClass = 'aspect-2/3',
    listTitle,
    renderItemOverlay,
}: ItemsListPageProps) => {
    const { t } = useTranslation(['item', 'library']);
    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseInt(searchParams.get('page') ?? '0', 10);
    const sortByParam = (searchParams.get('sortBy') as ItemSortBy) || DEFAULT_SORT_BY;
    const sortOrderParam = (searchParams.get('sortOrder') as SortOrder) || DEFAULT_SORT_ORDER;
    const [page, setPage] = useState<number>(Number.isNaN(pageParam) ? 0 : pageParam);
    const [sortBy, setSortBy] = useState<ItemSortBy>(sortByParam);
    const [sortOrder, setSortOrder] = useState<SortOrder>(sortOrderParam);
    const [pageSize, setPageSize] = useState(
        () => getColumnCount(typeof window !== 'undefined' ? window.innerWidth : 640) * ITEM_ROWS
    );

    const updateSearchParams = (
        nextPage: number,
        nextSortBy = sortBy,
        nextSortOrder = sortOrder
    ) => {
        setSearchParams({
            page: String(nextPage),
            sortBy: nextSortBy,
            sortOrder: nextSortOrder,
        });
    };

    useEffect(() => {
        const handleResize = () => {
            const newPageSize = getColumnCount(window.innerWidth) * ITEM_ROWS;
            setPageSize(newPageSize);
            setPage(0);
            updateSearchParams(0);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        updateSearchParams(newPage);
    };

    const handleSortChange = (newSortBy: ItemSortBy) => {
        setSortBy(newSortBy);
        setPage(0);
        updateSearchParams(0, newSortBy, sortOrder);
    };

    const handleSortOrderChange = (newSortOrder: SortOrder) => {
        setSortOrder(newSortOrder);
        setPage(0);
        updateSearchParams(0, sortBy, newSortOrder);
    };

    const totalPages = items?.totalCount ? Math.ceil(items.totalCount / pageSize) : 0;
    const gridCols =
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9';

    return (
        <div>
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
                <div className={`w-full gap-4 mt-2 grid ${gridCols}`}>
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
                    <ul className={`gw-full gap-4 grid ${gridCols}`}>
                        {items?.items?.map((child) => (
                            <ItemDisplay
                                key={child.Id}
                                item={child}
                                aspectClass={itemAspectClass}
                                overlay={renderItemOverlay?.(child)}
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
