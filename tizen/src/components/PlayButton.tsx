import { useLocation, useNavigate } from 'react-router-dom';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getUserId, useSeriesNextUp } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import FocusableButton from './FocusableButton';
import { buildPlayerUrl } from '@/lib/playerUrl';

const PlayButton = ({ item }: { item: BaseItemDto }) => {
    const { t } = useTranslation('item');
    const navigate = useNavigate();
    const location = useLocation();
    const isSeries = item.Type === 'Series';

    const { data: nextUpEpisode } = useSeriesNextUp(
        isSeries ? item.Id : undefined,
        getUserId() ?? undefined
    );

    const playItemId = isSeries ? nextUpEpisode?.Id : item.Id;
    const resume = isSeries
        ? (item.UserData?.PlayedPercentage ?? 0) > 0 ||
          (nextUpEpisode?.UserData?.PlaybackPositionTicks ?? 0) > 0
        : (item.UserData?.PlaybackPositionTicks ?? 0) > 0;

    const label = isSeries
        ? nextUpEpisode
            ? t(resume ? 'continue_episode' : 'play_episode', {
                  season: nextUpEpisode.ParentIndexNumber,
                  episode: nextUpEpisode.IndexNumber,
              })
            : t(resume ? 'common:resume' : 'play')
        : t(resume ? 'common:resume' : 'play');

    return (
        <FocusableButton
            autoFocus
            size="lg"
            disabled={!playItemId}
            onClick={() =>
                playItemId &&
                navigate(buildPlayerUrl(playItemId, location.pathname + location.search))
            }
        >
            <Play /> {label}
        </FocusableButton>
    );
};

export default PlayButton;
