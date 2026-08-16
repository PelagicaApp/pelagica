import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useBoxSetItems(boxSetId: string | null | undefined) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['boxSetItems', boxSetId],
        queryFn: async (): Promise<BaseItemDto[]> => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
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
