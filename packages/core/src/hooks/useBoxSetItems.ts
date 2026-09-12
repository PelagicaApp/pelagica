import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useBoxSetItems(boxSetId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['boxSetItems', boxSetId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getLibraryApi(api);
            const response = await itemsApi.getItems({
                parentId: boxSetId!,
                fields: ['Overview', 'MediaSources'],
                enableUserData: true,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        enabled: !!boxSetId,
        ...getRetryConfig(),
    });
}
