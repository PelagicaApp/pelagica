import { Badge } from '@/components/ui/badge';
import type { AppConfig, DetailBadge } from '@pelagica/core';
import { getEndsAt, ticksToReadableTime } from '@pelagica/core';
import { getVideoQualityLabel } from '@/utils/videoQuality';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { TFunction } from 'i18next';
import { Star } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';

function getDetailBadge(
    item: BaseItemDto,
    detailBadgeType: DetailBadge,
    t: TFunction
): React.ReactNode | null {
    switch (detailBadgeType) {
        case 'ReleaseYear':
            return item.PremiereDate ? new Date(item.PremiereDate).getFullYear().toString() : null;
        case 'ReleaseYearAndMonth':
            return item.PremiereDate
                ? new Date(item.PremiereDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                  })
                : null;
        case 'ReleaseDate':
            return item.PremiereDate
                ? new Date(item.PremiereDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : null;
        case 'CommunityRating':
            return item.CommunityRating ? (
                <div className="flex items-center gap-1">
                    <Star size={14} />
                    {item.CommunityRating.toFixed(1)}
                </div>
            ) : null;
        case 'PlayDuration':
            return item.RunTimeTicks ? ticksToReadableTime(item.RunTimeTicks) : null;
        case 'PlayEnd':
            return item.RunTimeTicks
                ? t('ends_at', {
                      date: getEndsAt(item.RunTimeTicks).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                      }),
                  })
                : null;
        case 'SeasonCount':
            return item.ChildCount !== undefined && item.ChildCount !== null
                ? item.ChildCount === 1
                    ? t('season_count', { count: item.ChildCount })
                    : t('season_count_plural', { count: item.ChildCount })
                : null;
        case 'EpisodeCount':
            return item.RecursiveItemCount !== undefined && item.RecursiveItemCount !== null
                ? item.RecursiveItemCount === 1
                    ? t('episode_count', { count: item.RecursiveItemCount })
                    : t('episode_count_plural', { count: item.RecursiveItemCount })
                : null;
        case 'AgeRating':
            return item.OfficialRating || null;
        case 'EpisodeNumber':
            return item.IndexNumber !== undefined &&
                item.IndexNumber !== null &&
                item.ParentIndexNumber !== undefined &&
                item.ParentIndexNumber !== null
                ? t('season_episode', { season: item.ParentIndexNumber, episode: item.IndexNumber })
                : null;
        case 'Duration':
            return item.RunTimeTicks ? ticksToReadableTime(item.RunTimeTicks) : null;
        case 'VideoQuality':
            return item.MediaStreams ? getVideoQualityLabel(item.MediaStreams) : null;
        default:
            return null;
    }
}

interface DetailBadgesProps {
    item: BaseItemDto;
    appConfig: AppConfig;
}

const DetailBadges = ({ item, appConfig }: DetailBadgesProps) => {
    const { t } = useTranslation('item');
    const detailBadges = appConfig.itemPage?.detailBadges;

    if (!detailBadges || detailBadges.length === 0) return null;

    const badgeElements = detailBadges
        .map((badgeType) => {
            const badgeContent = getDetailBadge(item, badgeType, t);
            return badgeContent ? (
                <Badge key={badgeType} variant={'outline'}>
                    {badgeContent}
                </Badge>
            ) : null;
        })
        .filter(Boolean);

    return badgeElements.length > 0 ? (
        <div className="flex flex-wrap gap-2">{badgeElements}</div>
    ) : null;
};

export default DetailBadges;
