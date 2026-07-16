import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';
import { getUserId } from '@/utils/localstorageCredentials';

export interface UseLiveTvProgramsOptions {
    channelIds: string[];
    startDate: Date;
    endDate: Date;
}

export function useLiveTvPrograms({
    channelIds,
    startDate,
    endDate,
}: UseLiveTvProgramsOptions): ReturnType<typeof useQuery<BaseItemDto[]>> {
    return useQuery<BaseItemDto[]>({
        queryKey: [
            'liveTvPrograms',
            [...channelIds].sort(),
            startDate.toISOString(),
            endDate.toISOString(),
        ],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const liveTvApi = getLiveTvApi(api);
            const response = await liveTvApi.getLiveTvPrograms({
                channelIds,
                userId: getUserId() || undefined,
                minEndDate: startDate.toISOString(),
                maxStartDate: endDate.toISOString(),
                sortBy: ['StartDate'],
                enableImages: false,
                enableUserData: false,
                fields: [ItemFields.Overview],
            });
            return response.data.Items || [];
        },
        enabled: channelIds.length > 0,
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        ...getRetryConfig(),
    });
}
