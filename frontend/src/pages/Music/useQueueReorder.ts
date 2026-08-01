import { useCallback, useEffect, useRef, useState } from 'react';
import { dropIndexAtY, reorderWithCurrentIndex } from './queueReorder';

type UseQueueReorderArgs<T> = {
    queue: T[];
    currentIndex: number;
    setQueue: (queue: T[]) => void;
    setCurrentIndex: (index: number) => void;
};

export function useQueueReorder<T>({
    queue,
    currentIndex,
    setQueue,
    setCurrentIndex,
}: UseQueueReorderArgs<T>) {
    const listRef = useRef<HTMLDivElement>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragOverIndexRef = useRef<number | null>(null);
    const suppressNextClickRef = useRef(false);

    const applyReorder = useCallback(
        (from: number, to: number) => {
            const { queue: nextQueue, currentIndex: nextIndex } = reorderWithCurrentIndex(
                queue,
                from,
                to,
                currentIndex
            );
            setQueue(nextQueue);
            setCurrentIndex(nextIndex);
        },
        [queue, currentIndex, setQueue, setCurrentIndex]
    );

    const startReorder = useCallback((index: number) => {
        setDraggingIndex(index);
        setDragOverIndex(index);
        dragOverIndexRef.current = index;
    }, []);

    useEffect(() => {
        if (draggingIndex === null) return;

        const previousTouchAction = document.body.style.touchAction;
        document.body.style.touchAction = 'none';

        const onMove = (event: PointerEvent) => {
            const list = listRef.current;
            if (!list) return;
            const next = dropIndexAtY(list, event.clientY);
            dragOverIndexRef.current = next;
            setDragOverIndex(next);
            if (next !== draggingIndex) {
                suppressNextClickRef.current = true;
            }
        };

        const finish = () => {
            const from = draggingIndex;
            const to = dragOverIndexRef.current ?? from;
            if (from !== to) {
                applyReorder(from, to);
            }
            setDraggingIndex(null);
            setDragOverIndex(null);
            dragOverIndexRef.current = null;
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', finish);

        return () => {
            document.body.style.touchAction = previousTouchAction;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', finish);
        };
    }, [draggingIndex, applyReorder]);

    const onDragHandlePointerDown = useCallback(
        (event: React.PointerEvent, index: number) => {
            event.preventDefault();
            event.stopPropagation();
            suppressNextClickRef.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
            startReorder(index);
        },
        [startReorder]
    );

    const shouldSuppressRowClick = useCallback(() => {
        if (!suppressNextClickRef.current) return false;
        suppressNextClickRef.current = false;
        return true;
    }, []);

    return {
        listRef,
        draggingIndex,
        dragOverIndex,
        onDragHandlePointerDown,
        shouldSuppressRowClick,
    };
}
