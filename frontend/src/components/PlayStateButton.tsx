import { Button } from '@/components/ui/button';
import { useItemPlayState } from '@pelagica/core';
import { useMarkItemPlayed } from '@pelagica/core';
import { useMarkItemUnplayed } from '@pelagica/core';
import { Circle, CircleCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlayStateButtonProps {
    itemId: string;
    userId: string;
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | null | undefined;
    variant?:
        | 'default'
        | 'link'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | null
        | undefined;
}

const PlayStateButton = ({ itemId, userId, size, variant }: PlayStateButtonProps) => {
    const { t } = useTranslation('item');
    const { data: playState } = useItemPlayState(itemId, userId);
    const markItemPlayed = useMarkItemPlayed();
    const markItemUnplayed = useMarkItemUnplayed();

    const togglePlayState = () => {
        if (playState?.played) {
            markItemUnplayed.mutate({ itemId, userId });
        } else {
            markItemPlayed.mutate({ itemId, userId });
        }
    };

    return (
        <Button
            variant={variant || 'outline'}
            size={size || 'icon'}
            onClick={togglePlayState}
            title={playState?.played ? t('mark_as_unplayed') : t('mark_as_played')}
        >
            {playState?.played ? <CircleCheck /> : <Circle />}
        </Button>
    );
};

export default PlayStateButton;
