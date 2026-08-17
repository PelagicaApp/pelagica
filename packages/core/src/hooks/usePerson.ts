import { useQuery } from '@tanstack/react-query';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getItemCached } from '../api/getItemCached';
import { getRetryConfig } from '../utils/authErrorHandler';

export function usePerson(itemId: string | null | undefined, userId?: string | undefined) {
    return useQuery<BaseItemDto>({
        queryKey: ['person', itemId],
        queryFn: async (): Promise<BaseItemDto> => {
            const item = await getItemCached(itemId!, userId);
            if (!item) {
                throw new Error(`Item not found: ${itemId}`);
            }
            return item;
        },
        enabled: !!itemId,
        ...getRetryConfig(),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
