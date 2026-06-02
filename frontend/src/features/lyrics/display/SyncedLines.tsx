import type { LyricLine } from '@jellyfin/sdk/lib/generated-client/models';
import { cn } from '@/lib/utils';
import { useSyncedLyrics } from '../hooks/useSyncedLyrics';
import { getLineClassName, getLineState } from './StaticLines';

interface SyncedLinesProps {
    lines: LyricLine[];
    currentTime: number;
    offset?: number | null;
    onLineClick: (startTicks: number) => void;
}

const SyncedLines = ({ lines, currentTime, offset, onLineClick }: SyncedLinesProps) => {
    const {
        activeIndex,
        containerRef,
        disableAutoScroll,
        edgePadding,
        enableAutoScroll,
        scrollActiveLineIntoView,
        setLineRef,
    } = useSyncedLyrics({
        lines,
        currentTime,
        offset,
        enabled: true,
    });

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto overscroll-contain scroll-smooth"
            onWheel={disableAutoScroll}
            onTouchMove={disableAutoScroll}
        >
            <div
                className="flex flex-col items-center gap-5 px-4"
                style={{ paddingTop: edgePadding, paddingBottom: edgePadding }}
            >
                {lines.map((line, index) => {
                    const state = getLineState(index, activeIndex);
                    const start = line.Start ?? 0;

                    return (
                        <button
                            key={`${index}-${line.Text}`}
                            ref={(element) => setLineRef(index, element)}
                            type="button"
                            className={cn(
                                getLineClassName(state),
                                'max-w-lg cursor-pointer px-4 text-center',
                            )}
                            onClick={() => {
                                enableAutoScroll();
                                onLineClick(start);
                                requestAnimationFrame(() => scrollActiveLineIntoView('smooth'));
                            }}
                        >
                            {line.Text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SyncedLines;
