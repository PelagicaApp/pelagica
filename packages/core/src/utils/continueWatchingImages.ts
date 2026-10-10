import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getBackdropUrl, getPrimaryImageUrl, getThumbUrl, type ImageSize } from './jellyfinUrls';

export function getContinueWatchingImageUrls(
    item: BaseItemDto,
    useSeriesImage = false,
    size: ImageSize = { width: 416 }
): string[] {
    const urls: string[] = [];

    if (useSeriesImage && item.SeriesId) {
        const seriesThumbTag =
            item.ParentThumbItemId === item.SeriesId
                ? item.ParentThumbImageTag
                : item.SeriesThumbImageTag;
        urls.push(getThumbUrl(item.SeriesId, size, seriesThumbTag));

        if (item.ParentBackdropItemId && item.ParentBackdropImageTags?.length) {
            urls.push(
                getBackdropUrl(item.ParentBackdropItemId, size, item.ParentBackdropImageTags[0])
            );
        } else {
            urls.push(getBackdropUrl(item.SeriesId, size));
        }
    }

    if (item.Id) {
        if (item.ImageTags?.Thumb) urls.push(getThumbUrl(item.Id, size, item.ImageTags.Thumb));
        if (item.BackdropImageTags?.length)
            urls.push(getBackdropUrl(item.Id, size, item.BackdropImageTags[0]));
        if (item.ImageTags?.Primary)
            urls.push(getPrimaryImageUrl(item.Id, size, item.ImageTags.Primary));
    }

    return urls;
}
