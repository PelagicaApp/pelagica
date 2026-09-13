import { useNavigate } from '@/router';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getUserId, useEpisodes, useSeasons, useSeriesNextUp } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import FocusableButton from './FocusableButton';
import { buildPlayerUrl } from '@/lib/playerUrl';

const PlayButton = ({ item }: { item: BaseItemDto }) => {
    const { t } = useTranslation('item');
    const navigate = useNavigate();
    const isSeries = item.Type === 'Series';

    const { data: nextUpEpisode, isSuccess: nextUpLoaded } = useSeriesNextUp(
        isSeries ? item.Id : undefined,
        getUserId() ?? undefined
    );

    // No next up item means there's nothing left to continue
    const needsFirstEpisode = isSeries && nextUpLoaded && !nextUpEpisode;

    const { data: seasons } = useSeasons(needsFirstEpisode ? item.Id : undefined);
    const firstSeason = seasons?.find((season) => (season.IndexNumber ?? 0) > 0) ?? seasons?.[0];

    const { data: firstSeasonEpisodes } = useEpisodes(
        needsFirstEpisode ? (item.Id ?? null) : null,
        needsFirstEpisode ? (firstSeason?.Id ?? null) : null
    );
    const firstEpisode = firstSeasonEpisodes?.[0];

    const episodeToPlay = nextUpEpisode ?? firstEpisode;

    const playItemId = isSeries ? episodeToPlay?.Id : item.Id;
    const resume = isSeries
        ? (episodeToPlay?.UserData?.PlaybackPositionTicks ?? 0) > 0
        : (item.UserData?.PlaybackPositionTicks ?? 0) > 0;

    const label = isSeries
        ? episodeToPlay
            ? t(resume ? 'continue_episode' : 'play_episode', {
                  season: episodeToPlay.ParentIndexNumber,
                  episode: episodeToPlay.IndexNumber,
              })
            : t(resume ? 'common:resume' : 'play')
        : t(resume ? 'common:resume' : 'play');

    return (
        <FocusableButton
            autoFocus
            size="lg"
            disabled={!playItemId}
            onClick={() => playItemId && navigate(buildPlayerUrl(playItemId))}
        >
            <Play /> {label}
        </FocusableButton>
    );
};

export default PlayButton;
