import { createContext, useContext } from 'react';

export type SearchMode = 'movies-tv' | 'music';

interface SearchContextType {
    isOpen: boolean;
    searchMode: SearchMode;
    openSearch: (mode?: SearchMode) => void;
    closeSearch: () => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) throw new Error('useSearch must be used within SearchProvider');
    return context;
};
