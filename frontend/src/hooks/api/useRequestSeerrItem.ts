import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SeerrRequestPayload } from '@/api/seerr/types';
import { requestSeerrItem } from '@/api/seerr/request';

export function useRequestSeerrItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: SeerrRequestPayload) => requestSeerrItem(payload),
        onSuccess: (_data, payload) => {
            queryClient.invalidateQueries({
                queryKey: ['seerrItemDetails', payload.mediaType, payload.mediaId],
            });
        },
    });
}
