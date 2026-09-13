import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useSeasons(seriesId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['seasons', seriesId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getLibraryApi(api);
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
