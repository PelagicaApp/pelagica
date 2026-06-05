import { useEffect } from 'react';
import { useSearch } from '@/context/SearchContext';

export const KeyboardShortcuts = () => {
    const { openSearch } = useSearch();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearch();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
                e.preventDefault();
                openSearch('music');
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [openSearch]);

    return null;
};
