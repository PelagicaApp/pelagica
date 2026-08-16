import type { PropsWithChildren } from 'react';
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { RowIdentityContext } from '@/lib/row-identity-context';

const ScrollableHomeSection = ({
    title,
    focusable = true,
    children,
}: PropsWithChildren<{ title: string; focusable?: boolean }>) => {
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
        focusable,
        saveLastFocusedChild: true,
    });

    return (
        <section className="min-w-0 w-full flex flex-col">
            <h2 className="text-lg font-semibold">{title}</h2>
            <FocusContext.Provider value={focusKey}>
                <RowIdentityContext.Provider value={title}>
                    <div
                        ref={ref}
                        className="scrollbar-hide min-w-0 flex gap-4 overflow-x-auto p-3"
                    >
                        {children}
                    </div>
                </RowIdentityContext.Provider>
            </FocusContext.Provider>
        </section>
    );
};

export default ScrollableHomeSection;
