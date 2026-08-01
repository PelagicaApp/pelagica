import { useContext } from 'react';
import { PageScrollContext } from '@/context/pageScrollContext';

export function usePageScrollElement() {
    return useContext(PageScrollContext);
}
