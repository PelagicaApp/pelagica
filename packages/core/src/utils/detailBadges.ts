import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import type { TFunction } from 'i18next';
import type { DetailBadge } from '../hooks/useConfig';
import { getEndsAt, ticksToReadableTime } from './timeConversion';
import { getVideoQualityLabel } from './videoQuality';

export type DetailBadgeValue =
    | { kind: 'text'; text: string }
    | { kind: 'icon-text'; icon: 'star' | 'award'; text: string };

export function getDetailBadgeValue(
    item: BaseItemDto,
    detailBadgeType: DetailBadge,
    t: TFunction
): DetailBadgeValue | null {
    switch (detailBadgeType) {
        case 'ReleaseYear':
            return item.PremiereDate
                ? { kind: 'text', text: new Date(item.PremiereDate).getFullYear().toString() }
                : null;
        case 'ReleaseYearAndMonth':
            return item.PremiereDate
                ? {
                      kind: 'text',
                      text: new Date(item.PremiereDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                      }),
                  }
                : null;
        case 'ReleaseDate':
            return item.PremiereDate
                ? {
                      kind: 'text',
                      text: new Date(item.PremiereDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                      }),
                  }
                : null;
        case 'CommunityRating':
            return item.CommunityRating
                ? { kind: 'icon-text', icon: 'star', text: item.CommunityRating.toFixed(1) }
                : null;
        case 'CriticsRating':
            return item.CriticRating
                ? { kind: 'icon-text', icon: 'award', text: `${item.CriticRating.toFixed(0)}%` }
                : null;
        case 'PlayDuration':
            return item.RunTimeTicks
                ? { kind: 'text', text: ticksToReadableTime(item.RunTimeTicks) }
                : null;
        case 'PlayEnd':
            return item.RunTimeTicks
                ? {
                      kind: 'text',
                      text: t('ends_at', {
                          date: getEndsAt(item.RunTimeTicks).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                          }),
                      }),
                  }
                : null;
        case 'SeasonCount':
            return item.ChildCount !== undefined && item.ChildCount !== null
                ? {
                      kind: 'text',
                      text:
                          item.ChildCount === 1
                              ? t('season_count', { count: item.ChildCount })
                              : t('season_count_plural', { count: item.ChildCount }),
                  }
                : null;
        case 'EpisodeCount':
            return item.RecursiveItemCount !== undefined && item.RecursiveItemCount !== null
                ? {
                      kind: 'text',
                      text:
                          item.RecursiveItemCount === 1
                              ? t('episode_count', { count: item.RecursiveItemCount })
                              : t('episode_count_plural', { count: item.RecursiveItemCount }),
                  }
                : null;
        case 'AgeRating':
            return item.OfficialRating ? { kind: 'text', text: item.OfficialRating } : null;
        case 'EpisodeNumber':
            return item.IndexNumber !== undefined &&
                item.IndexNumber !== null &&
                item.ParentIndexNumber !== undefined &&
                item.ParentIndexNumber !== null
                ? {
                      kind: 'text',
                      text: t('season_episode', {
                          season: item.ParentIndexNumber,
                          episode: item.IndexNumber,
                      }),
                  }
                : null;
        case 'Duration':
            return item.RunTimeTicks
                ? { kind: 'text', text: ticksToReadableTime(item.RunTimeTicks) }
                : null;
        case 'VideoQuality':
            return item.MediaStreams
                ? { kind: 'text', text: getVideoQualityLabel(item.MediaStreams) }
                : null;
        default:
            return null;
    }
}
