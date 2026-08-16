import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useConfig, useLike } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import FocusableButton from './FocusableButton';
import { Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';

const WatchlistButton = ({ item }: { item: BaseItemDto }) => {
    const { t } = useTranslation('item');
    const { config } = useConfig();
    const { isLiked, toggleLike, isLoading: isLikeLoading } = useLike(item.Id);

    if (!config.itemPage?.showWatchlistButton) return null;

    return (
        <FocusableButton
            variant="outline"
            size="lg"
            onClick={() => toggleLike(!isLiked)}
            disabled={isLikeLoading}
        >
            <Bookmark className={cn(isLiked && 'fill-current')} />
            {isLiked ? t('remove_from_watchlist') : t('add_to_watchlist')}
        </FocusableButton>
    );
};

export default WatchlistButton;
