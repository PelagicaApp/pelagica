import { createContext, useContext, type PropsWithChildren } from 'react';

const PageScrollContext = createContext<HTMLElement | null>(null);

export function PageScrollProvider({
    scrollElement,
    children,
}: PropsWithChildren<{ scrollElement: HTMLElement | null }>) {
    return (
        <PageScrollContext.Provider value={scrollElement}>{children}</PageScrollContext.Provider>
    );
}

export function usePageScrollElement() {
    return useContext(PageScrollContext);
}
