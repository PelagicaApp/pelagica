import { type PropsWithChildren } from 'react';
import { PageScrollContext } from '@/context/pageScrollContext';

export function PageScrollProvider({
    scrollElement,
    children,
}: PropsWithChildren<{ scrollElement: HTMLElement | null }>) {
    return (
        <PageScrollContext.Provider value={scrollElement}>{children}</PageScrollContext.Provider>
    );
}
