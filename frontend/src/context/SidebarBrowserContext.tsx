'use client';

import * as React from 'react';
import type { BrowserMediaCategory } from '@/utils/sidebarLibraryNavigation';

export type SidebarBrowseCategory = BrowserMediaCategory | 'all';

const CATEGORY_STORAGE_KEY = 'pelagica_sidebar_browse_category';
const SEARCH_STORAGE_KEY = 'pelagica_sidebar_browse_search';

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

type SidebarBrowserContextValue = {
    category: SidebarBrowseCategory;
    setCategory: (category: SidebarBrowseCategory) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
};

const SidebarBrowserContext = React.createContext<SidebarBrowserContextValue | null>(null);

export function SidebarBrowserProvider({ children }: { children: React.ReactNode }) {
    const [category, setCategoryState] = React.useState<SidebarBrowseCategory>(readStoredCategory);
    const [searchQuery, setSearchQueryState] = React.useState(readStoredSearchQuery);

    const setCategory = React.useCallback((next: SidebarBrowseCategory) => {
        setCategoryState(next);
        try {
            sessionStorage.setItem(CATEGORY_STORAGE_KEY, next);
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

    const value = React.useMemo(
        () => ({ category, setCategory, searchQuery, setSearchQuery }),
        [category, setCategory, searchQuery, setSearchQuery]
    );

    return (
        <SidebarBrowserContext.Provider value={value}>{children}</SidebarBrowserContext.Provider>
    );
}

export function useSidebarBrowser() {
    const context = React.useContext(SidebarBrowserContext);
    if (!context) {
        throw new Error('useSidebarBrowser must be used within SidebarBrowserProvider.');
    }
    return context;
}
