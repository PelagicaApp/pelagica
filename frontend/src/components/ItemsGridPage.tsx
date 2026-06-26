import { Skeleton } from '@/components/ui/skeleton';
import { getPrimaryImageUrl, type ImageSize } from '@/utils/jellyfinUrls';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
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
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import ItemPagination from '@/components/ItemPagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ButtonGroup } from '@/components/ui/button-group';
import type { ItemsGridState, ItemsQueryResult } from '@/hooks/useItemsGridState';

export type { ItemsGridState, ItemsQueryParams, ItemsQueryResult } from '@/hooks/useItemsGridState';

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

export interface ItemsGridPageProps {
    /** Heading shown above the grid */
    title?: string;
    /** Sort/pagination state from useItemsGridState() */
    state: ItemsGridState;
    /** Result of fetching items for `state.params` */
    result: ItemsQueryResult;
    /** Poster aspect ratio class for grid items */
    itemAspectClass?: string;
    /** Optional render prop to overlay something on each poster (e.g. WatchedStateBadge) */
    renderItemOverlay?: (item: BaseItemDto) => ReactNode;
    /** Override the default /item/:id link for each item */
    getItemUrl?: (item: BaseItemDto) => string;
    /** Whether to show the sort/order controls (default true) */
    showFilters?: boolean;
}

/**
 * Presentational sortable, paginated grid of items. Pair with
 * `useItemsGridState()` for the sort/pagination state, and fetch the items
 * for `state.params` yourself (so the data hook stays a direct, unconditional
 * call at the top of your page component). Used by ItemsListPage (items
 * scoped to a parent like a genre or studio) and ItemsSectionPage (items
 * scoped to a SectionItemsConfig from a home screen row).
 */
const ItemsGridPage = ({
    title,
    state,
    result,
    itemAspectClass = 'aspect-2/3',
    renderItemOverlay,
    getItemUrl,
    showFilters = true,
}: ItemsGridPageProps) => {
    const { t } = useTranslation(['item', 'library']);
    const { data: items, isLoading: loadingItems, error } = result;
    const { page, sortBy, sortOrder, pageSize, setPage, setSortBy, setSortOrder } = state;

    const totalPages = items?.totalCount ? Math.ceil(items.totalCount / pageSize) : 0;
    const gridCols =
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                {showFilters && (
                    <ButtonGroup>
                        <Select onValueChange={setSortBy} value={sortBy}>
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
                        <Select onValueChange={setSortOrder} value={sortOrder}>
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
                )}
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
                                linkUrl={getItemUrl?.(child)}
                            />
                        ))}
                    </ul>
                    <ItemPagination
                        totalPages={totalPages}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
};

export default ItemsGridPage;
