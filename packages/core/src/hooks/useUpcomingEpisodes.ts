import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useUpcomingEpisodes(seriesId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['upcoming-episodes', seriesId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getTvShowsApi(api);
            const response = await itemsApi.getUpcomingEpisodes({
                parentId: seriesId!,
                enableImages: true,
                fields: ['Overview', 'AirTime'],
            });
            return response.data.Items || [];
        },
        enabled: !!seriesId,
        ...getRetryConfig(),
    });
}
