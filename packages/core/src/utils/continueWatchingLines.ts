import type {
    ContinueWatchingDetailLine,
    ContinueWatchingTitleLine,
    TranslateFn,
} from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ticksToReadableTime } from './timeConversion';

export function getTitleLineText(
    item: BaseItemDto,
    titleLine: ContinueWatchingTitleLine | undefined,
    t: TranslateFn
): string {
    const itemNameWithFallback = item.Name || item.SeriesName || t('no_title');

    switch (titleLine) {
        case 'ItemTitle':
            return item.Name || t('no_title');
        case 'ParentTitle':
            return item.SeriesName || item.Name || t('no_title');
        default: // 'ItemTitleWithEpisodeInfo'
            if (item.SeriesId && item.ParentIndexNumber && item.IndexNumber) {
                return `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${itemNameWithFallback}`;
            } else {
                return itemNameWithFallback;
            }
    }
}

export function getDetailLineText(
    item: BaseItemDto,
    detailLine: ContinueWatchingDetailLine | undefined,
    t: TranslateFn
): string | null {
    const watched = item.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = item.RunTimeTicks ?? 0;

    switch (detailLine) {
        case 'ProgressPercentage':
            if (runtime > 0) {
                const progress = (watched / runtime) * 100;
                return t('progress_watched', { percent: Math.floor(progress) });
            }
            return t('progress_unknown');
        case 'TimeRemaining':
            if (runtime > 0) {
                const remainingTicks = Math.max(runtime - watched, 0);
                return t('time_remaining', { time: ticksToReadableTime(remainingTicks) });
            }
            return t('time_remaining_unknown');
        case 'EndsAt':
            if (runtime > 0) {
                const remainingTicks = Math.max(runtime - watched, 0);
                const endsAt = new Date(Date.now() + remainingTicks / 10000); // ticks to ms
                return t('ends_at', {
                    date: endsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                });
            }
            return t('ends_at_unknown');
        case 'EpisodeInfo':
            if (item.SeriesId && item.ParentIndexNumber && item.IndexNumber) {
                return `S${item.ParentIndexNumber}:E${item.IndexNumber}`;
            }
            return null;
        case 'ParentTitle':
            return item.SeriesName || null;
        case 'None':
            return null;
        default:
            return '';
    }
}
