'use client';

import { useDeferredValue, useEffect, useMemo } from 'react';
import { Film, Music2, Search, Tv } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { SidebarInput, useSidebar } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useUserViews } from '@/hooks/api/useUserViews';
import { useInfiniteLibraryItems } from '@/hooks/api/useInfiniteLibraryItems';
import {
    buildLibrarySearchParams,
    collectionTypeToCategory,
    findLibraryIdForCategory,
    type BrowserMediaCategory,
} from '@/utils/sidebarLibraryNavigation';
import { getIncludeItemTypesForCategory } from '@/utils/sidebarBrowseItems';
import { useSidebarBrowser } from '@/context/SidebarBrowserContext';
import { SidebarBrowserResultsList } from '@/components/SidebarBrowserResultsList';

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

type SidebarBrowserMockProps = {
    className?: string;
};

export function SidebarBrowserMock({ className }: SidebarBrowserMockProps) {
    const { state, isMobile } = useSidebar();
    const { category, setCategory, searchQuery, setSearchQuery } = useSidebarBrowser();
    const { data: views } = useUserViews();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const debouncedQuery = useDeferredValue(searchQuery.trim());

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
        if (
            libraryIdFromUrl &&
            views?.Items?.some((library) => library.Id === libraryIdFromUrl)
        ) {
            return libraryIdFromUrl;
        }
        return findLibraryIdForCategory(views?.Items, category);
    }, [libraryIdFromUrl, views?.Items, category]);

    const includeItemTypes = getIncludeItemTypesForCategory(category);
    const listQueryKey = `${activeLibraryId}-${category}-${debouncedQuery}`;

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteLibraryItems(activeLibraryId, {
        sortBy: ['Name'],
        sortOrder: 'Ascending',
        includeItemTypes,
        searchTerm: debouncedQuery || undefined,
    });

    const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data?.pages]);
    const totalCount = data?.pages[0]?.totalCount ?? 0;

    const navigateToLibraryForCategory = (nextCategory: BrowserMediaCategory | 'all') => {
        const libraryId = findLibraryIdForCategory(views?.Items, nextCategory);
        if (!libraryId) return;
        navigate(`/library?${buildLibrarySearchParams(libraryId).toString()}`);
    };

    const handleCategoryChange = (value: string) => {
        const nextCategory = value as BrowserMediaCategory;
        setCategory(nextCategory);
        setSearchQuery('');
        navigateToLibraryForCategory(nextCategory);
    };

    const activeTab = toTabCategory(category);

    const handleSelectItem = (itemId: string) => {
        navigate(`/item/${itemId}`);
    };

    if (state === 'collapsed' && !isMobile) {
        return (
            <p className="text-muted-foreground px-3 py-6 text-center text-xs leading-relaxed">
                Expand the sidebar
                <span className="text-foreground block font-medium">Ctrl+B</span>
                to browse
            </p>
        );
    }

    return (
        <section
            data-testid="sidebar-browser"
            className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-2', className)}
        >
            <h2 className="px-0.5 text-sm font-semibold leading-tight">Browse</h2>

            <div className="relative shrink-0">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <SidebarInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search library…"
                    className="bg-background pl-8"
                />
            </div>

            <Tabs
                value={activeTab}
                onValueChange={handleCategoryChange}
                className="shrink-0 gap-0"
            >
                <TabsList className="w-full">
                    {CATEGORY_TABS.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="flex-1 gap-1 px-1 text-xs sm:px-2"
                        >
                            {tab.icon}
                            <span className="truncate">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="text-muted-foreground flex shrink-0 items-center justify-between px-0.5 text-xs font-medium">
                    <span>Results</span>
                    <span className="tabular-nums">
                        {isLoading
                            ? '…'
                            : `${items.length}${totalCount > items.length ? ` / ${totalCount}` : ''}`}
                    </span>
                </div>
                {!activeLibraryId ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                        No library available for this category.
                    </p>
                ) : (
                    <SidebarBrowserResultsList
                        key={listQueryKey}
                        items={items}
                        isLoading={isLoading}
                        isFetchingNextPage={isFetchingNextPage}
                        hasNextPage={hasNextPage ?? false}
                        fetchNextPage={fetchNextPage}
                        activeItemPath={location.pathname}
                        onSelectItem={handleSelectItem}
                        emptyMessage={
                            debouncedQuery
                                ? 'No matches for your search.'
                                : 'This library is empty.'
                        }
                    />
                )}
            </div>
        </section>
    );
}
