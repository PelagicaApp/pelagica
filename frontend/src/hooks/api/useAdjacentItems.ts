import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

type AdjacentItems = {
    previousItem: BaseItemDto | null;
    nextItem: BaseItemDto | null;
};

export function useAdjacentItems(
    currentItem: BaseItemDto | null | undefined,
    userId: string | null | undefined
) {
    return useQuery<AdjacentItems | null>({
        queryKey: ['adjacentItem', currentItem?.Id, userId],
        queryFn: async (): Promise<AdjacentItems | null> => {
            if (!currentItem?.Id || !currentItem?.SeriesId) return null;

            const api = getApi();
            const tvShowsApi = getTvShowsApi(api);

            const response = await tvShowsApi.getEpisodes({
                seriesId: currentItem.SeriesId,
                userId: userId!,
                adjacentTo: currentItem.Id,
                limit: 3,
                fields: ['Overview', 'MediaSources', 'PrimaryImageAspectRatio'],
                enableUserData: true,
                enableImages: true,
            });

            const items = response.data.Items || [];
            const currentItemIndex = items.findIndex((item) => item.Id === currentItem.Id);
            const previousItem = items[currentItemIndex - 1] || null;
            const nextItem = items[currentItemIndex + 1] || null;
            return { previousItem, nextItem };
        },
        enabled: !!currentItem?.Id && !!currentItem?.SeriesId && !!userId,
        ...getRetryConfig(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
