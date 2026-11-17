import { useMemo, type ReactNode } from 'react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useMovePlaylistItem } from '@pelagica/core';
import { cn } from '@/lib/utils';
import type { PlaylistRow } from '@/hooks/usePlaylistRows';

interface SortablePlaylistProps {
    playlistId: string | undefined;
    rows: PlaylistRow[];
    children: ReactNode;
}

export function SortablePlaylist({ playlistId, rows, children }: SortablePlaylistProps) {
    const moveItem = useMovePlaylistItem();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const ids = useMemo(() => rows.map((row) => row.sortId), [rows]);

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!playlistId || !over || active.id === over.id) return;
        const from = rows.find((row) => row.sortId === active.id);
        const to = rows.find((row) => row.sortId === over.id);
        const playlistItemId = from?.entry.PlaylistItemId;
        if (!from || !to || !playlistItemId) return;

        moveItem.mutate({
            playlistId,
            playlistItemId,
            fromIndex: from.fullIndex,
            newIndex: to.fullIndex,
        });
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </DndContext>
    );
}

interface SortablePlaylistRowProps {
    row: PlaylistRow;
    children: ReactNode;
    className?: string;
    handleClassName?: string;
}

export function SortablePlaylistRow({
    row,
    children,
    className,
    handleClassName,
}: SortablePlaylistRowProps) {
    const disabled = !row.entry.PlaylistItemId;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: row.sortId,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'group/sortable relative flex items-center',
                isDragging && 'z-10 opacity-60',
                className
            )}
        >
            <button
                type="button"
                aria-label="Reorder"
                disabled={disabled}
                className={cn(
                    'shrink-0 self-stretch flex items-center px-1 text-muted-foreground touch-none',
                    'cursor-grab active:cursor-grabbing disabled:invisible',
                    'opacity-40 group-hover/sortable:opacity-100 focus-visible:opacity-100 transition-opacity',
                    handleClassName
                )}
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
