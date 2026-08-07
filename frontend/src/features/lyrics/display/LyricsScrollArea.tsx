import type { PropsWithChildren, RefObject } from 'react';

interface LyricsScrollAreaProps extends PropsWithChildren {
    containerRef: RefObject<HTMLDivElement | null>;
    edgePadding: number;
    onUserScroll?: () => void;
}

const LyricsScrollArea = ({
    containerRef,
    edgePadding,
    onUserScroll,
    children,
}: LyricsScrollAreaProps) => {
    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto overscroll-contain scroll-smooth no-scrollbar"
            onScroll={onUserScroll}
            onWheel={onUserScroll}
            onTouchMove={onUserScroll}
        >
            <div
                className="flex flex-col items-center gap-5 px-4"
                style={{ paddingTop: edgePadding, paddingBottom: edgePadding }}
            >
                {children}
            </div>
        </div>
    );
};

export default LyricsScrollArea;
