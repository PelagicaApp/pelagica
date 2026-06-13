import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Page from '../Page';
import { useUserViews } from '@/hooks/api/useUserViews';
import { useMemo, useState, useEffect } from 'react';
import { useLibraryItems } from '@/hooks/api/useLibraryItems';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import ItemPagination from '@/components/ItemPagination';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    ArrowDownWideNarrow,
    ArrowUpNarrowWideIcon,
    Calendar,
    CalendarPlus,
    CaseSensitive,
    Clock,
    FolderOpen,
    Star,
} from 'lucide-react';
import JellyfinLibraryIcon from '@/components/JellyfinLibraryIcon';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BaseItemDto, CollectionType, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { ButtonGroup } from '@/components/ui/button-group';
import LibraryItem from './LibraryItem';
import HomeVideoGrid, { TARGET_ROW_HEIGHT } from './HomeVideoGrid';
import { COLLECTION_ITEM_TYPES, DIRECT_PLAY_TYPES, SUPPORTED_LIBRARY_COLLECTION_TYPES } from '@/utils/itemTypes';
import { getPrimaryImageUrl, type ImageSize } from '@/utils/jellyfinUrls';

const ITEM_ROWS = 5;
const HOME_VIDEO_PAGE_SIZE = 50;

const DEFAULT_POSTER_SIZE = { width: 416, height: 640 };

const ITEM_POSTER_SIZES: Partial<Record<CollectionType, ImageSize>> = {
    music: { width: 416, height: 416 },
    musicvideos: { width: 700, height: 394 },
};

const DEFAULT_POSTER_ASPECT_RATIO = '2/3';

const ITEM_POSTER_ASPECT_RATIOS: Partial<Record<CollectionType, string>> = {
    music: 'square',
    musicvideos: 'video',
};

type GridConfig = { cols: string; breakpoints: [number, number][] };

const DEFAULT_GRID_CONFIG: GridConfig = {
    cols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9',
    breakpoints: [[1536, 9], [1280, 7], [1024, 5], [768, 4], [640, 3], [0, 2]],
};

const ITEM_GRID_CONFIG: Partial<Record<CollectionType, GridConfig>> = {
    musicvideos: {
        cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        breakpoints: [[1536, 6], [1280, 5], [1024, 4], [768, 3], [0, 2]],
    },
};

function getGridConfig(collectionType: CollectionType): GridConfig {
    return ITEM_GRID_CONFIG[collectionType] ?? DEFAULT_GRID_CONFIG;
}

function getColumnCount(width: number, collectionType: CollectionType): number {
    const { breakpoints } = getGridConfig(collectionType);
    return breakpoints.find(([minWidth]) => width >= minWidth)?.[1] ?? 2;
}

function getPageSize(width: number, collectionType: CollectionType): number {
    if (collectionType === 'homevideos') return HOME_VIDEO_PAGE_SIZE;
    return getColumnCount(width, collectionType) * ITEM_ROWS;
}

function getDetailLine(item: BaseItemDto): string | undefined {
    if (item.Type === 'MusicAlbum') return item.AlbumArtist || undefined;
    return item.PremiereDate ? new Date(item.PremiereDate).getFullYear().toString() : undefined;
}

const SKELETON_ASPECT_RATIOS = [1.5, 0.75, 1.78, 1, 1.33, 0.67, 2, 1.2, 1.5, 0.8, 1, 1.78];

const LibraryContent = ({
    libraryId,
    sortBy,
    sortOrder,
    page,
    onPageChange,
    collectionType,
}: {
    libraryId: string;
    sortBy: ItemSortBy;
    sortOrder: SortOrder;
    page: number;
    collectionType: CollectionType;
    onPageChange: (p: number) => void;
}) => {
    const { t } = useTranslation(['library', 'common']);
    const [pageSize, setPageSize] = useState(
        () => getPageSize(typeof window !== 'undefined' ? window.innerWidth : 640, collectionType)
    );

    useEffect(() => {
        const handleResize = () => {
            setPageSize((prev) => {
                const next = getPageSize(window.innerWidth, collectionType);
                if (next !== prev) onPageChange(0);
                return next;
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [onPageChange, collectionType]);

    const { data: libraryData, isLoading } = useLibraryItems(libraryId, {
        limit: pageSize,
        startIndex: page * pageSize,
        includeItemTypes: COLLECTION_ITEM_TYPES[collectionType],
        sortBy: [sortBy],
        sortOrder,
    });

    const posterUrls = useMemo(() => {
        if (!libraryData || collectionType === 'homevideos') return {};
        return libraryData.items.reduce(
            (acc, item) => {
                acc[item.Id!] = getPrimaryImageUrl(
                    item.Id!,
                    ITEM_POSTER_SIZES[collectionType] || DEFAULT_POSTER_SIZE,
                    item.ImageTags?.Primary
                );
                return acc;
            },
            {} as Record<string, string>
        );
    }, [libraryData, collectionType]);

    const totalPages = libraryData?.totalCount ? Math.ceil(libraryData.totalCount / pageSize) : 0;
    const gridCols = getGridConfig(collectionType).cols;
    const posterAspectRatio = ITEM_POSTER_ASPECT_RATIOS[collectionType] || DEFAULT_POSTER_ASPECT_RATIO;
    const isDirectPlay = DIRECT_PLAY_TYPES.includes(collectionType);
    const isHomeVideos = collectionType === 'homevideos';

    return (
        <div className="mb-4">
            {isLoading && !isHomeVideos && (
                <div className={`w-full gap-4 mt-2 grid ${gridCols}`}>
                    {Array.from({ length: pageSize }).map((_, i) => (
                        <div key={i} className="p-0 m-0">
                            <div className={`relative w-full aspect-${posterAspectRatio} overflow-hidden rounded-md`}>
                                <Skeleton className="w-full h-full" />
                            </div>
                            <Skeleton className="mt-2 h-4 w-3/4" />
                            <Skeleton className="mt-1 h-3 w-1/4" />
                        </div>
                    ))}
                </div>
            )}
            {isLoading && isHomeVideos && (
                <div className="flex flex-wrap mt-2" style={{ gap: 8 }}>
                    {SKELETON_ASPECT_RATIOS.map((ar, i) => (
                        <Skeleton
                            key={i}
                            style={{ height: TARGET_ROW_HEIGHT, width: Math.round(TARGET_ROW_HEIGHT * ar) }}
                            className="rounded-md"
                        />
                    ))}
                </div>
            )}
            {!isLoading && libraryData && !libraryData.items?.length && (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FolderOpen />
                        </EmptyMedia>
                        <EmptyTitle>{t('library:no_items_title')}</EmptyTitle>
                        <EmptyDescription>{t('library:no_items_description')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}
            {!isLoading && libraryData && libraryData.items && libraryData.items.length > 0 && (
                <>
                    {isHomeVideos ? (
                        <HomeVideoGrid items={libraryData.items} />
                    ) : (
                        <div className={`w-full gap-4 mt-2 grid ${gridCols}`}>
                            {libraryData.items.map((item) => (
                                <LibraryItem
                                    key={item.Id}
                                    item={item}
                                    posterUrl={posterUrls[item.Id!]}
                                    t={t}
                                    posterAspectRatio={posterAspectRatio}
                                    detailLine={getDetailLine(item)}
                                    isDirectPlay={isDirectPlay}
                                />
                            ))}
                        </div>
                    )}
                    <ItemPagination
                        totalPages={totalPages}
                        currentPage={page}
                        onPageChange={onPageChange}
                    />
                </>
            )}
        </div>
    );
};

const LibraryPage = () => {
    const { t } = useTranslation('library');
    const { data: libraries } = useUserViews();
    const [searchParams, setSearchParams] = useSearchParams();

    const sortBy = (searchParams.get('sortBy') as ItemSortBy) || 'Name';
    const sortOrder = (searchParams.get('sortOrder') as SortOrder) || 'Ascending';
    const page = Number(searchParams.get('page') ?? '0') || 0;

    const libraryIdFromUrl = searchParams.get('library') || '';

    const libraryItems = useMemo(() => {
        return (
            libraries?.Items?.filter((library) =>
                SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(library.CollectionType!)
            ) ?? []
        );
    }, [libraries?.Items]);

    const activeLibraryId = useMemo(() => {
        if (!libraryItems.length) return libraryIdFromUrl;

        const exists = libraryItems.some(l => l.Id === libraryIdFromUrl);
        return exists ? libraryIdFromUrl : libraryItems[0]?.Id ?? '';
    }, [libraryItems, libraryIdFromUrl]);

    const updateParams = (updates: Record<string, string>) => {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(updates)) {
            next.set(key, value);
        }
        setSearchParams(next, { replace: true });
    };

    const handleLibraryChange = (libraryId: string) => {
        updateParams({
            library: libraryId,
            page: '0',
        });
    };

    const handleSortByChange = (value: string) => {
        updateParams({
            sortBy: value,
            page: '0',
        });
    };

    const handleSortOrderChange = (value: string) => {
        updateParams({
            sortOrder: value,
            page: '0',
        });
    };

    const handlePageChange = (p: number) => {
        updateParams({
            page: String(p),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Page title={t('title')} requiresAuth className="flex-1">
            <Tabs value={activeLibraryId} onValueChange={handleLibraryChange} className="w-full">
                <div className="flex flex-col sm:items-center sm:justify-between sm:flex-row gap-2">
                    <TabsList className="max-w-full overflow-auto hidden sm:flex">
                        {libraryItems?.map((library) => (
                            <TabsTrigger key={library.Id} value={library.Id ?? ''}>
                                <JellyfinLibraryIcon libraryType={library.CollectionType} />
                                {library.Name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <Select onValueChange={handleLibraryChange} value={activeLibraryId}>
                        <SelectTrigger size="sm" className="w-full sm:hidden">
                            <SelectValue placeholder={t('select_library')} />
                        </SelectTrigger>
                        <SelectContent>
                            {libraryItems?.map((library) => (
                                <SelectItem key={library.Id} value={library.Id ?? ''}>
                                    <JellyfinLibraryIcon libraryType={library.CollectionType} />
                                    {library.Name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <ButtonGroup>
                        <Select onValueChange={handleSortByChange} value={sortBy}>
                            <SelectTrigger size="sm">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Name">
                                    <CaseSensitive />
                                    {t('sort_name')}
                                </SelectItem>
                                <SelectItem value="DateCreated">
                                    <CalendarPlus />
                                    {t('sort_date_added')}
                                </SelectItem>
                                <SelectItem value="PremiereDate">
                                    <Calendar />
                                    {t('sort_premiere_date')}
                                </SelectItem>
                                <SelectItem value="CommunityRating">
                                    <Star />
                                    {t('sort_community_rating')}
                                </SelectItem>
                                <SelectItem value="Runtime">
                                    <Clock />
                                    {t('sort_runtime')}
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
                                    {t('ascending')}
                                </SelectItem>
                                <SelectItem value="Descending">
                                    <ArrowDownWideNarrow />
                                    {t('descending')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </ButtonGroup>
                </div>

                {libraryItems?.map((library) => {
                    if (!library.Id) return null;

                    return (
                        <TabsContent key={library.Id} value={library.Id}>
                            <LibraryContent
                                key={`${library.Id}-${sortBy}-${sortOrder}`}
                                libraryId={library.Id}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                page={page}
                                onPageChange={handlePageChange}
                                collectionType={library.CollectionType as CollectionType}
                            />
                        </TabsContent>
                    );
                })}
            </Tabs>
        </Page>
    );
};

export default LibraryPage;