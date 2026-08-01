import { GripVertical, ListMusic, X } from 'lucide-react';
import { useCallback } from 'react';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQueueReorder } from './useQueueReorder';

type MusicQueueSidebarProps = {
    variant?: 'sidebar' | 'page';
};

const MusicQueueSidebar = ({ variant = 'sidebar' }: MusicQueueSidebarProps) => {
    const isPage = variant === 'page';
    const asideClassName = isPage
        ? 'flex min-h-0 w-full flex-1 flex-col'
        : 'w-72 shrink-0 flex flex-col h-full pl-2';
    const { t } = useTranslation('music');
    const { queue, currentIndex, loadQueue, setQueue, setCurrentIndex } = useMusicPlayback();

    const {
        listRef,
        draggingIndex,
        dragOverIndex,
        onDragHandlePointerDown,
        shouldSuppressRowClick,
    } = useQueueReorder({
        queue,
        currentIndex,
        setQueue,
        setCurrentIndex,
    });

    const removeTrack = useCallback(
        (indexToRemove: number) => {
            setQueue(queue.filter((_, i) => i !== indexToRemove));
            if (indexToRemove < currentIndex) {
                setCurrentIndex(currentIndex - 1);
            }
        },
        [queue, currentIndex, setQueue, setCurrentIndex]
    );

    const handleRowClick = useCallback(
        (index: number) => {
            if (shouldSuppressRowClick()) return;
            loadQueue(queue, index, true);
        },
        [loadQueue, queue, shouldSuppressRowClick]
    );

    if (queue.length === 0) {
        return (
            <aside className={asideClassName}>
                {!isPage && (
                    <div className="flex items-center gap-2 px-3 py-1.5 mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <ListMusic className="w-4 h-4" />
                        {t('queue')}
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">{t('queue_empty')}</span>
                </div>
            </aside>
        );
    }

    return (
        <aside className={asideClassName}>
            {!isPage && (
                <div className="mb-2 flex items-center justify-between px-3 py-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <ListMusic className="w-4 h-4" />
                        {t('queue_count', { count: queue.length })}
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div ref={listRef} className="flex flex-col gap-0.5">
                    {queue.map((track, index) => (
                        <div
                            key={`${track.id}-${index}`}
                            data-queue-item
                            className={cn(
                                'flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors min-w-0 group sm:gap-2.5 sm:px-3',
                                dragOverIndex === index
                                    ? 'bg-accent border-2 border-dashed border-primary/40'
                                    : index === currentIndex
                                      ? 'bg-accent/70'
                                      : 'hover:bg-accent/50',
                                draggingIndex === index && dragOverIndex !== index && 'opacity-40'
                            )}
                            onClick={() => handleRowClick(index)}
                        >
                            <button
                                type="button"
                                className={cn(
                                    'touch-none shrink-0 rounded p-0.5 text-muted-foreground cursor-grab active:cursor-grabbing',
                                    isPage
                                        ? 'opacity-70'
                                        : 'opacity-0 group-hover:opacity-70 hover:opacity-100'
                                )}
                                aria-label={t('reorder_queue')}
                                onClick={(event) => event.stopPropagation()}
                                onPointerDown={(event) => onDragHandlePointerDown(event, index)}
                            >
                                <GripVertical className="h-4 w-4" />
                            </button>
                            <img
                                src={getPrimaryImageUrl(track.albumId || track.id, {
                                    width: 64,
                                    height: 64,
                                })}
                                alt={track.title}
                                className="w-10 h-10 rounded object-cover shrink-0"
                                loading="lazy"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                                <span
                                    className={cn(
                                        'text-sm truncate',
                                        index === currentIndex && 'font-medium'
                                    )}
                                >
                                    {track.title}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {track.artist}
                                </span>
                            </div>
                            {index === currentIndex && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTrack(index);
                                }}
                                className={cn(
                                    'hover:text-destructive shrink-0 rounded p-0.5 transition-all',
                                    isPage
                                        ? 'opacity-70'
                                        : 'opacity-0 group-hover:opacity-100'
                                )}
                                style={{ display: 'flex' }}
                                aria-label={t('remove_from_queue')}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default MusicQueueSidebar;
