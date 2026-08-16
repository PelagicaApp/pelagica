import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useSeasons(seriesId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['seasons', seriesId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                parentId: seriesId!,
                includeItemTypes: ['Season'],
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        enabled: !!seriesId,
        ...getRetryConfig(),
    });
}
