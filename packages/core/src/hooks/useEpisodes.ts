import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useEpisodes(seriesId: string | null, seasonId?: string | null) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['episodes', seriesId, seasonId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const tvShowsApi = getShowApi(api);
            const response = await tvShowsApi.getEpisodes({
                seriesId: seriesId!,
                seasonId: seasonId ?? undefined,
                fields: ['Overview', 'MediaSources'],
                enableUserData: true,
            });
            return response.data.Items || [];
        },
        enabled: !!seriesId && !!seasonId,
        ...getRetryConfig(),
    });
}
