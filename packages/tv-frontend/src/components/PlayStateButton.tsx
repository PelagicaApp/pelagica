import { useItemPlayState } from '@pelagica/core';
import { useMarkItemPlayed } from '@pelagica/core';
import { useMarkItemUnplayed } from '@pelagica/core';
import { Circle, CircleCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FocusableButton from './FocusableButton';

interface PlayStateButtonProps {
    itemId: string;
    userId: string;
}

const PlayStateButton = ({ itemId, userId }: PlayStateButtonProps) => {
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
        <FocusableButton
            variant="outline"
            size="lg"
            onClick={togglePlayState}
            title={playState?.played ? t('mark_as_unplayed') : t('mark_as_played')}
        >
            {playState?.played ? <CircleCheck /> : <Circle />}
        </FocusableButton>
    );
};

export default PlayStateButton;
