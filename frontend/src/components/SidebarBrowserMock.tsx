'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Film, Music2, Search, Tv } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { SidebarInput, useSidebar } from '@/components/ui/sidebar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUserViews } from '@/hooks/api/useUserViews';
import { useLibraryItems } from '@/hooks/api/useLibraryItems';
import {
    buildLibrarySearchParams,
    collectionTypeToCategory,
    findLibraryIdForCategory,
    type BrowserMediaCategory,
} from '@/utils/sidebarLibraryNavigation';
import { getIncludeItemTypesForCategory } from '@/utils/sidebarBrowseItems';
import { SidebarBrowserListItem } from '@/components/SidebarBrowserListItem';
import { useSidebarBrowser } from '@/context/SidebarBrowserContext';

const SIDEBAR_RESULT_LIMIT = 100;

const CATEGORY_OPTIONS: {
    value: BrowserMediaCategory | 'all';
    label: string;
    icon: React.ReactNode;
}[] = [
    { value: 'all', label: 'All media', icon: <Search className="size-4" /> },
    { value: 'music', label: 'Music', icon: <Music2 className="size-4" /> },
    { value: 'series', label: 'Series', icon: <Tv className="size-4" /> },
    { value: 'movie', label: 'Movies', icon: <Film className="size-4" /> },
];

type SidebarBrowserMockProps = {
    className?: string;
};

export function SidebarBrowserMock({ className }: SidebarBrowserMockProps) {
    const { state, isMobile } = useSidebar();
    const { category, setCategory } = useSidebarBrowser();
    const { data: views } = useUserViews();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const debouncedQuery = useDeferredValue(query.trim());

    const libraryIdFromUrl = searchParams.get('library');
    const categoryFromUrl = useMemo(() => {
        if (location.pathname !== '/library' || !libraryIdFromUrl) return 'all' as const;
        const library = views?.Items?.find((item) => item.Id === libraryIdFromUrl);
        return collectionTypeToCategory(library?.CollectionType);
    }, [location.pathname, libraryIdFromUrl, views?.Items]);

    // Sync from library URL when on /library (category lives in router-level context).
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

    const { data: libraryData, isLoading, isFetching } = useLibraryItems(activeLibraryId, {
        limit: SIDEBAR_RESULT_LIMIT,
        sortBy: ['Name'],
        sortOrder: 'Ascending',
        includeItemTypes,
        searchTerm: debouncedQuery || undefined,
    });

    const items = libraryData?.items ?? [];
    const totalCount = libraryData?.totalCount ?? 0;

    const navigateToLibraryForCategory = (nextCategory: BrowserMediaCategory | 'all') => {
        const libraryId = findLibraryIdForCategory(views?.Items, nextCategory);
        if (!libraryId) return;
        navigate(`/library?${buildLibrarySearchParams(libraryId).toString()}`);
    };

    const handleCategoryChange = (value: BrowserMediaCategory | 'all') => {
        setCategory(value);
        setQuery('');
        navigateToLibraryForCategory(value);
    };

    const handleSelectItem = (itemId: string) => {
        navigate(`/item/${itemId}`);
    };

    const showLoading = isLoading || (isFetching && items.length === 0);

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
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search library…"
                    className="bg-background pl-8"
                />
            </div>

            <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-background w-full shrink-0" size="sm">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="text-muted-foreground flex shrink-0 items-center justify-between px-0.5 text-xs font-medium">
                    <span>Results</span>
                    <span className="tabular-nums">
                        {showLoading ? '…' : `${items.length}${totalCount > items.length ? ` / ${totalCount}` : ''}`}
                    </span>
                </div>
                <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border">
                    {!activeLibraryId && (
                        <li className="text-muted-foreground py-6 text-center text-sm">
                            No library available for this category.
                        </li>
                    )}
                    {activeLibraryId && showLoading &&
                        Array.from({ length: 8 }).map((_, i) => (
                            <li key={i} className="flex items-center gap-2 px-1.5 py-1.5">
                                <Skeleton className="size-10 shrink-0 rounded-md" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </li>
                        ))}
                    {activeLibraryId && !showLoading && items.length === 0 && (
                        <li className="text-muted-foreground py-6 text-center text-sm">
                            {debouncedQuery ? 'No matches for your search.' : 'This library is empty.'}
                        </li>
                    )}
                    {activeLibraryId &&
                        !showLoading &&
                        items.map((item) => (
                            <SidebarBrowserListItem
                                key={item.Id}
                                item={item}
                                isActive={location.pathname === `/item/${item.Id}`}
                                onSelect={(selected) => handleSelectItem(selected.Id!)}
                            />
                        ))}
                </ul>
            </div>
        </section>
    );
}
