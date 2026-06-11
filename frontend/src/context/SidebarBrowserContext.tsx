'use client';

import * as React from 'react';
import type { BrowserMediaCategory } from '@/utils/sidebarLibraryNavigation';
import {
    getDefaultBrowseFilter,
    normalizeBrowseFilter,
    type SidebarBrowseFilter,
} from '@/utils/sidebarBrowseFilters';

export type SidebarBrowseCategory = BrowserMediaCategory | 'all';

const CATEGORY_STORAGE_KEY = 'pelagica_sidebar_browse_category';
const SEARCH_STORAGE_KEY = 'pelagica_sidebar_browse_search';
const FILTER_STORAGE_KEY = 'pelagica_sidebar_browse_filter';
const BROWSE_MODE_STORAGE_KEY = 'pelagica_sidebar_browse_mode';

function readStoredBrowseMode(): boolean {
    try {
        return sessionStorage.getItem(BROWSE_MODE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function parseStoredCategory(value: string): SidebarBrowseCategory | null {
    if (value === 'music' || value === 'series' || value === 'movie') return value;
    if (value === 'all') return 'movie';
    return null;
}

function readStoredCategory(): SidebarBrowseCategory {
    try {
        const stored = sessionStorage.getItem(CATEGORY_STORAGE_KEY);
        if (stored) {
            const parsed = parseStoredCategory(stored);
            if (parsed) return parsed;
        }
    } catch {
        // ignore
    }
    return 'movie';
}

function readStoredSearchQuery(): string {
    try {
        return sessionStorage.getItem(SEARCH_STORAGE_KEY) ?? '';
    } catch {
        return '';
    }
}

function toTabCategory(category: SidebarBrowseCategory): BrowserMediaCategory {
    return category === 'all' ? 'movie' : category;
}

function readStoredBrowseFilter(category: BrowserMediaCategory): SidebarBrowseFilter {
    try {
        const stored = sessionStorage.getItem(FILTER_STORAGE_KEY);
        if (stored) {
            return normalizeBrowseFilter(category, stored);
        }
    } catch {
        // ignore
    }
    return getDefaultBrowseFilter(category);
}

type SidebarBrowserContextValue = {
    browseMode: boolean;
    setBrowseMode: (enabled: boolean) => void;
    category: SidebarBrowseCategory;
    setCategory: (category: SidebarBrowseCategory) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    browseFilter: SidebarBrowseFilter;
    setBrowseFilter: (filter: SidebarBrowseFilter) => void;
};

const SidebarBrowserContext = React.createContext<SidebarBrowserContextValue | null>(null);

export function SidebarBrowserProvider({ children }: { children: React.ReactNode }) {
    const [browseMode, setBrowseModeState] = React.useState(readStoredBrowseMode);
    const [category, setCategoryState] = React.useState<SidebarBrowseCategory>(readStoredCategory);
    const [searchQuery, setSearchQueryState] = React.useState(readStoredSearchQuery);
    const [browseFilter, setBrowseFilterState] = React.useState<SidebarBrowseFilter>(() =>
        readStoredBrowseFilter(toTabCategory(readStoredCategory()))
    );

    const setBrowseMode = React.useCallback((enabled: boolean) => {
        setBrowseModeState(enabled);
        try {
            sessionStorage.setItem(BROWSE_MODE_STORAGE_KEY, String(enabled));
        } catch {
            // ignore
        }
    }, []);

    const setCategory = React.useCallback((next: SidebarBrowseCategory) => {
        const tabCategory = toTabCategory(next);
        setCategoryState(next);
        setBrowseFilterState(getDefaultBrowseFilter(tabCategory));
        try {
            sessionStorage.setItem(CATEGORY_STORAGE_KEY, next);
            sessionStorage.setItem(FILTER_STORAGE_KEY, getDefaultBrowseFilter(tabCategory));
        } catch {
            // ignore
        }
    }, []);

    const setSearchQuery = React.useCallback((next: string) => {
        setSearchQueryState(next);
        try {
            sessionStorage.setItem(SEARCH_STORAGE_KEY, next);
        } catch {
            // ignore
        }
    }, []);

    const setBrowseFilter = React.useCallback((next: SidebarBrowseFilter) => {
        setBrowseFilterState(next);
        try {
            sessionStorage.setItem(FILTER_STORAGE_KEY, next);
        } catch {
            // ignore
        }
    }, []);

    const value = React.useMemo(
        () => ({
            browseMode,
            setBrowseMode,
            category,
            setCategory,
            searchQuery,
            setSearchQuery,
            browseFilter,
            setBrowseFilter,
        }),
        [
            browseMode,
            setBrowseMode,
            category,
            setCategory,
            searchQuery,
            setSearchQuery,
            browseFilter,
            setBrowseFilter,
        ]
    );

    return (
        <SidebarBrowserContext.Provider value={value}>{children}</SidebarBrowserContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebarBrowser() {
    const context = React.useContext(SidebarBrowserContext);
    if (!context) {
        throw new Error('useSidebarBrowser must be used within SidebarBrowserProvider.');
    }
    return context;
}
