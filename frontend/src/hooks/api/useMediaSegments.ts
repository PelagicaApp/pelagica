import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getMediaSegmentsApi } from '@jellyfin/sdk/lib/utils/api/media-segments-api';
import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';

export function useMediaSegments(itemId: string | null | undefined) {
    return useQuery<MediaSegmentDto[]>({
        queryKey: ['mediaSegments', itemId],
        queryFn: async (): Promise<MediaSegmentDto[]> => {
            const api = getApi();
            const mediaSegmentsApi = getMediaSegmentsApi(api);
            const response = await mediaSegmentsApi.getItemSegments({
                itemId: itemId!,
            });
            return response.data.Items || [];
        },
        enabled: !!itemId,
        ...getRetryConfig(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
