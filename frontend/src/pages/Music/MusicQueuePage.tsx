import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import MusicQueueSidebar from './MusicQueueSidebar';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';

const MusicQueuePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation('music');
    const { queue } = useMusicPlayback();

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">{t('queue')}</h1>
                {queue.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">({queue.length})</span>
                )}
            </div>
            <MusicQueueSidebar variant="page" />
        </div>
    );
};

export default MusicQueuePage;
