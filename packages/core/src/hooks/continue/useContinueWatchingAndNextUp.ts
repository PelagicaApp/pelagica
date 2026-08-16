import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

function deduplicateById(items: BaseItemDto[]): BaseItemDto[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (!item.Id || seen.has(item.Id)) return false;
        seen.add(item.Id);
        return true;
    });
}

interface ContinueWatchingAndNextUpResult {
    items: BaseItemDto[];
}

export function useContinueWatchingAndNextUp(
    userId: string | null | undefined,
    limit: number = 20,
    accurateSorting: boolean = true
) {
    return useQuery({
        queryKey: ['continueWatchingAndNextUp', userId, limit, accurateSorting],
        queryFn: async (): Promise<ContinueWatchingAndNextUpResult> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const tvShowsApi = getTvShowsApi(api);

            const resumeLimit = limit * 2;

            const [resumeResponse, nextUpResponse] = await Promise.all([
                itemsApi.getResumeItems({
                    userId: userId!,
                    limit: resumeLimit,
                    startIndex: 0,
                    fields: ['PrimaryImageAspectRatio'],
                    includeItemTypes: ['Movie', 'Episode'],
                    enableUserData: true,
                    enableImages: true,
                }),
                tvShowsApi.getNextUp({
                    userId: userId!,
                    limit,
                    startIndex: 0,
                    fields: ['PrimaryImageAspectRatio'],
                    enableUserData: true,
                    enableImages: true,
                }),
            ]);

            const resumeItems = resumeResponse.data.Items || [];
            const nextUpItems = nextUpResponse.data.Items || [];
            const continueWatchingItems = [...resumeItems, ...nextUpItems];

            if (accurateSorting) {
                const itemsNeedingAdjacentData = continueWatchingItems.filter(
                    (item) =>
                        item.Type === 'Episode' &&
                        !item.UserData?.LastPlayedDate &&
                        item.SeriesId &&
                        item.IndexNumber
                );

                // Group by series so each series is hit once
                const seriesIds = [
                    ...new Set(itemsNeedingAdjacentData.map((item) => item.SeriesId!)),
                ];

                const seriesEpisodesMap = new Map<string, BaseItemDto[]>();

                await Promise.all(
                    seriesIds.map(async (seriesId) => {
                        try {
                            const response = await tvShowsApi.getEpisodes({
                                seriesId,
                                userId: userId!,
                                enableUserData: true,
                                enableImages: false,
                            });
                            seriesEpisodesMap.set(seriesId, response.data.Items || []);
                        } catch {
                            // Ignore
                        }
                    })
                );

                itemsNeedingAdjacentData.forEach((item) => {
                    const episodes = seriesEpisodesMap.get(item.SeriesId!);
                    if (!episodes) return;

                    const currentItemIndex = episodes.findIndex((ep) => ep.Id === item.Id);
                    const previousEpisode = episodes[currentItemIndex - 1];

                    if (previousEpisode?.UserData?.LastPlayedDate) {
                        item.UserData = item.UserData || {};
                        item.UserData.LastPlayedDate = previousEpisode.UserData.LastPlayedDate;
                    }
                });
            }

            const sorted = continueWatchingItems.sort((a, b) => {
                const dateA = a.UserData?.LastPlayedDate || a.DateCreated || '';
                const dateB = b.UserData?.LastPlayedDate || b.DateCreated || '';
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });

            const deduplicated = deduplicateById(sorted);

            return { items: deduplicated.slice(0, limit) };
        },
        enabled: !!userId,
        ...getRetryConfig(),
    });
}
