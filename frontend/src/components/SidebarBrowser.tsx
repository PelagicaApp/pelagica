'use client';

import { useDeferredValue, useEffect, useMemo } from 'react';
import { ArrowLeft, Film, Music2, Search, Tv } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUserViews } from '@/hooks/api/useUserViews';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { useInfiniteLibraryItems } from '@/hooks/api/useInfiniteLibraryItems';
import { useInfiniteSidebarGenres } from '@/hooks/api/useInfiniteSidebarGenres';
import {
    buildLibrarySearchParams,
    collectionTypeToCategory,
    findLibraryIdForCategory,
    type BrowserMediaCategory,
} from '@/utils/sidebarLibraryNavigation';
import {
    buildGenreItemUrl,
    getGenresIncludeItemTypes,
    getItemTypesForBrowseFilter,
    isGenresBrowseFilter,
} from '@/utils/sidebarBrowseFilters';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useSidebarBrowser } from '@/context/SidebarBrowserContext';
import { SidebarBrowserResultsList } from '@/components/SidebarBrowserResultsList';
import { SidebarBrowseFilterTabs } from '@/components/SidebarBrowseFilterTabs';
import { useTranslation } from 'react-i18next';

const CATEGORY_TABS: {
    value: BrowserMediaCategory;
    label: string;
    icon: React.ReactNode;
}[] = [
    { value: 'music', label: 'Music', icon: <Music2 className="size-3.5" /> },
    { value: 'series', label: 'Series', icon: <Tv className="size-3.5" /> },
    { value: 'movie', label: 'Movies', icon: <Film className="size-3.5" /> },
];

function toTabCategory(category: BrowserMediaCategory | 'all'): BrowserMediaCategory {
    return category === 'all' ? 'movie' : category;
}

type SidebarBrowserProps = {
    className?: string;
    onClose?: () => void;
};

export function SidebarBrowser({ className, onClose }: SidebarBrowserProps) {
    const { t } = useTranslation('sidebar');
    const {
        category,
        setCategory,
        searchQuery,
        setSearchQuery,
        browseFilter,
        setBrowseFilter,
        setBrowseMode,
    } = useSidebarBrowser();
    const { data: views } = useUserViews();
    const { data: user } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const debouncedQuery = useDeferredValue(searchQuery.trim());

    const activeCategory = toTabCategory(category);
    const showingGenres = isGenresBrowseFilter(browseFilter);

    const libraryIdFromUrl = searchParams.get('library');
    const categoryFromUrl = useMemo((): BrowserMediaCategory => {
        if (location.pathname !== '/library' || !libraryIdFromUrl) return 'movie';
        const library = views?.Items?.find((item) => item.Id === libraryIdFromUrl);
        return collectionTypeToCategory(library?.CollectionType);
    }, [location.pathname, libraryIdFromUrl, views?.Items]);

    useEffect(() => {
        if (location.pathname === '/library') {
            setCategory(categoryFromUrl);
        }
    }, [categoryFromUrl, location.pathname, setCategory]);

    const activeLibraryId = useMemo(() => {
        if (libraryIdFromUrl && views?.Items?.some((library) => library.Id === libraryIdFromUrl)) {
            return libraryIdFromUrl;
        }
        return findLibraryIdForCategory(views?.Items, activeCategory);
    }, [libraryIdFromUrl, views?.Items, activeCategory]);

    const includeItemTypes = getItemTypesForBrowseFilter(activeCategory, browseFilter);
    const isPlaylistMode = browseFilter === 'playlists';

    const listQueryKey = `${activeLibraryId}-${activeCategory}-${browseFilter}-${debouncedQuery}`;

    const libraryQuery = useInfiniteLibraryItems(isPlaylistMode ? null : activeLibraryId, {
        sortBy: ['Name'],
        sortOrder: 'Ascending',
        includeItemTypes: includeItemTypes ?? undefined,
        searchTerm: debouncedQuery || undefined,
        userId: isPlaylistMode ? user?.Id : undefined,
    });

    const genresQuery = useInfiniteSidebarGenres({
        parentId: activeLibraryId,
        includeItemTypes: getGenresIncludeItemTypes(activeCategory),
        searchTerm: debouncedQuery || undefined,
        enabled: showingGenres && !!activeLibraryId,
    });

    const activeQuery = showingGenres ? genresQuery : libraryQuery;

    const items = useMemo(
        () => activeQuery.data?.pages.flatMap((page) => page.items) ?? [],
        [activeQuery.data?.pages]
    );
    const totalCount = activeQuery.data?.pages[0]?.totalCount ?? 0;

    const goToLibraryForCategory = (
        nextCategory: BrowserMediaCategory,
        { clearSearch = false }: { clearSearch?: boolean } = {}
    ) => {
        setCategory(nextCategory);
        if (clearSearch) setSearchQuery('');

        const libraryId = findLibraryIdForCategory(views?.Items, nextCategory);
        if (!libraryId) return;

        navigate(`/library?${buildLibrarySearchParams(libraryId).toString()}`);
    };

    const handleCategoryChange = (value: string) => {
        goToLibraryForCategory(value as BrowserMediaCategory, { clearSearch: true });
    };

    const handleActiveTabClick = (tabCategory: BrowserMediaCategory) => {
        if (activeTab !== tabCategory) return;
        goToLibraryForCategory(tabCategory);
    };

    const activeTab = activeCategory;

    const handleSelectItem = (item: BaseItemDto) => {
        if (!item.Id) return;
        if (showingGenres || item.Type === 'Genre' || item.Type === 'MusicGenre') {
            navigate(buildGenreItemUrl(item.Id, activeCategory, activeLibraryId));
            return;
        }
        navigate(`/item/${item.Id}`);
    };

    const resultsLabel = showingGenres ? 'Genres' : 'Results';
    const searchPlaceholder = showingGenres ? 'Search genres…' : 'Search library…';
    const emptyMessage = showingGenres
        ? debouncedQuery
            ? 'No genres match your search.'
            : 'No genres found.'
        : debouncedQuery
          ? 'No matches for your search.'
          : isPlaylistMode
            ? 'No playlists found.'
            : 'This library is empty.';

    const listEnabled = showingGenres
        ? !!activeLibraryId
        : isPlaylistMode
          ? !!user?.Id
          : !!activeLibraryId;

    const handleExitBrowseMode = () => {
        setBrowseMode(false);
        onClose?.();
    };

    return (
        <section
            data-testid="sidebar-browser"
            className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-2', className)}
        >
            <div className="flex shrink-0 items-center justify-between gap-2 px-0.5">
                <h2 className="text-sm font-semibold leading-tight">{t('browse_library')}</h2>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={handleExitBrowseMode}
                >
                    <ArrowLeft className="size-3.5" />
                    {t('dismiss')}
                </Button>
            </div>

            <div className="relative shrink-0">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="bg-background pl-8"
                />
            </div>

            <div className="flex shrink-0 flex-col gap-1">
                <Tabs
                    value={activeTab}
                    onValueChange={handleCategoryChange}
                    className="shrink-0 gap-0"
                >
                    <TabsList className="h-10 w-full">
                        {CATEGORY_TABS.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex-1 gap-1.5 px-1 text-xs font-medium sm:px-2 sm:text-sm data-[state=active]:font-semibold"
                                onClick={() => handleActiveTabClick(tab.value)}
                            >
                                {tab.icon}
                                <span className="truncate">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <SidebarBrowseFilterTabs
                    category={activeCategory}
                    value={browseFilter}
                    onValueChange={setBrowseFilter}
                />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="text-muted-foreground flex shrink-0 items-center justify-between px-0.5 text-xs font-medium">
                    <span>{resultsLabel}</span>
                    <span className="tabular-nums">
                        {activeQuery.isLoading
                            ? '…'
                            : `${items.length}${totalCount > items.length ? ` / ${totalCount}` : ''}`}
                    </span>
                </div>
                {!listEnabled ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                        {isPlaylistMode
                            ? 'Sign in to browse playlists.'
                            : 'No library available for this category.'}
                    </p>
                ) : (
                    <SidebarBrowserResultsList
                        key={listQueryKey}
                        items={items}
                        isLoading={activeQuery.isLoading}
                        isFetchingNextPage={activeQuery.isFetchingNextPage}
                        hasNextPage={activeQuery.hasNextPage ?? false}
                        fetchNextPage={activeQuery.fetchNextPage}
                        activeItemPath={location.pathname}
                        onSelectItem={handleSelectItem}
                        emptyMessage={emptyMessage}
                    />
                )}
            </div>
        </section>
    );
}
