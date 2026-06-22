import { ListMusic } from 'lucide-react';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const MusicQueueSidebar = () => {
    const { t } = useTranslation('music');
    const { queue, currentIndex, loadQueue } = useMusicPlayback();

    if (queue.length === 0) {
        return (
            <aside className="w-72 shrink-0 flex flex-col h-full pl-2">
                <div className="flex items-center gap-2 px-3 py-1.5 mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <ListMusic className="w-4 h-4" />
                    {t('queue')}
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">{t('queue_empty')}</span>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-72 shrink-0 flex flex-col h-full pl-2">
            <div className="flex items-center justify-between px-3 py-1.5 mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <ListMusic className="w-4 h-4" />
                    {t('queue_count', { count: queue.length })}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="flex flex-col gap-0.5">
                    {queue.map((track, index) => (
                        <div
                            key={`${track.id}-${index}`}
                            className={cn(
                                'flex items-center gap-2.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors min-w-0',
                                index === currentIndex ? 'bg-accent/70' : 'hover:bg-accent/50'
                            )}
                            onClick={() => loadQueue(queue, index, true)}
                        >
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
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default MusicQueueSidebar;
