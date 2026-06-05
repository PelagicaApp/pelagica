import { useState, type ReactNode } from 'react';
import { SearchContext, type SearchMode } from './SearchContext';

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode>('movies-tv');

    return (
        <SearchContext.Provider
            value={{
                isOpen,
                searchMode,
                openSearch: (mode?: SearchMode) => {
                    setSearchMode(mode ?? 'movies-tv');
                    setIsOpen(true);
                },
                closeSearch: () => setIsOpen(false),
            }}
        >
            {children}
        </SearchContext.Provider>
    );
};
