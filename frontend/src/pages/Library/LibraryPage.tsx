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
import type { BaseItemDto, BaseItemKind, CollectionType, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { ButtonGroup } from '@/components/ui/button-group';
import LibraryItem from './LibraryItem';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '@/utils/supportedLibraryCollectionTypes';
import { getPrimaryImageUrl, type ImageSize } from '@/utils/jellyfinUrls';

const ITEM_ROWS = 5;

const DEFAULT_POSTER_SIZE = { width: 416, height: 640 };

const ITEM_POSTER_SIZES: Partial<Record<CollectionType, ImageSize>> = {
    music: { width: 416, height: 416 },
    musicvideos: { width: 700, height: 394 },
    homevideos: { width: 700, height: 394 },
};

const DEFAULT_POSTER_ASPECT_RATIO = '2/3';

const ITEM_POSTER_ASPECT_RATIOS: Partial<Record<CollectionType, string>> = {
    music: 'square',
    musicvideos: '16/9',
    homevideos: '16/9',
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
    homevideos: {
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

const DIRECT_PLAY_TYPES: CollectionType[] = ['musicvideos', 'homevideos'];

const COLLECTION_ITEM_TYPES: Partial<Record<CollectionType, BaseItemKind[]>> = {
    movies: ['Movie'],
    tvshows: ['Series'],
    boxsets: ['BoxSet'],
    music: ['MusicAlbum'],
    musicvideos: ['MusicVideo'],
    homevideos: ['Video', 'Photo'],
};

function getDetailLine(item: BaseItemDto): string | undefined {
    if (item.Type === 'MusicAlbum') return item.AlbumArtist || undefined;
    return item.PremiereDate ? new Date(item.PremiereDate).getFullYear().toString() : undefined;
}

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
        () => getColumnCount(typeof window !== 'undefined' ? window.innerWidth : 640, collectionType) * ITEM_ROWS
    );

    useEffect(() => {
        const handleResize = () => {
            setPageSize(getColumnCount(window.innerWidth, collectionType) * ITEM_ROWS);
            onPageChange(0);
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
        if (!libraryData) return {};
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

    return (
        <div className="mb-4">
            {isLoading && (
                <div className={`w-full gap-4 mt-2 grid ${gridCols}`}>
                    {Array.from({ length: pageSize }).map((_, i) => (
                        <div key={i} className="p-0 m-0">
                            <div className={`relative w-full ${posterAspectRatio} overflow-hidden rounded-md`}>
                                <Skeleton className="w-full h-full" />
                            </div>
                            <Skeleton className="mt-2 h-4 w-3/4" />
                            <Skeleton className="mt-1 h-3 w-1/4" />
                        </div>
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
    const sortByParam = (searchParams.get('sortBy') as ItemSortBy) || 'Name';
    const sortOrderParam = (searchParams.get('sortOrder') as SortOrder) || 'Ascending';
    const [sortBy, setSortBy] = useState<ItemSortBy>(sortByParam);
    const [sortOrder, setSortOrder] = useState<SortOrder>(sortOrderParam);
    const pageParam = parseInt(searchParams.get('page') ?? '0', 10);
    const [page, setPage] = useState<number>(Number.isNaN(pageParam) ? 0 : pageParam);

    const firstLibraryId = libraries?.Items?.[0]?.Id ?? '';
    const libraryIdFromUrl = searchParams.get('library') || '';
    const activeLibraryId =
        libraryIdFromUrl && libraries?.Items?.some((library) => library.Id === libraryIdFromUrl)
            ? libraryIdFromUrl
            : firstLibraryId;

    const handleLibraryChange = (libraryId: string) => {
        setPage(0);
        setSearchParams({ library: libraryId, page: '0', sortBy, sortOrder });
    };

    const libraryItems = libraries?.Items?.filter((library) =>
        SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(library.CollectionType!)
    );

    useEffect(() => {
        setSearchParams({
            library: activeLibraryId,
            page: String(page),
            sortBy,
            sortOrder,
        });
    }, [activeLibraryId, page, sortBy, sortOrder, setSearchParams]);

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
                    <Select
                        onValueChange={handleLibraryChange}
                        value={activeLibraryId}
                    >
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
                        <Select onValueChange={(v) => setSortBy(v as ItemSortBy)} value={sortBy}>
                            <SelectTrigger size="sm">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Name"><CaseSensitive />{t('sort_name')}</SelectItem>
                                <SelectItem value="DateCreated"><CalendarPlus />{t('sort_date_added')}</SelectItem>
                                <SelectItem value="PremiereDate"><Calendar />{t('sort_premiere_date')}</SelectItem>
                                <SelectItem value="CommunityRating"><Star />{t('sort_community_rating')}</SelectItem>
                                <SelectItem value="Runtime"><Clock />{t('sort_runtime')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(v) => setSortOrder(v as SortOrder)} value={sortOrder}>
                            <SelectTrigger size="sm">
                                <SelectValue placeholder="Order" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ascending"><ArrowUpNarrowWideIcon />{t('ascending')}</SelectItem>
                                <SelectItem value="Descending"><ArrowDownWideNarrow />{t('descending')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </ButtonGroup>
                </div>
                {libraryItems?.map((library) => {
                    if (!library.Id) return null;
                    return (
                        <TabsContent key={library.Id} value={library.Id ?? ''}>
                            <LibraryContent
                                key={`${library.Id}-${sortBy}-${sortOrder}`}
                                libraryId={library.Id}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                page={page}
                                onPageChange={setPage}
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