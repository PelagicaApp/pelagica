import { getApi } from '../api/getApi';
import { useMutation } from '@tanstack/react-query';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useCurrentSessionId } from './useCurrentSessionId';

export function useReportViewingItem() {
    const { data: sessionId } = useCurrentSessionId();

    const { mutate: reportViewing, isPending } = useMutation({
        mutationFn: async (itemId: string) => {
            if (!itemId) throw new Error('Item ID is required');
            if (!sessionId) throw new Error('Session ID is required');

            const api = getApi();
            const sessionApi = getSessionApi(api);

            await sessionApi.reportViewing({
                itemId,
                sessionId,
            });

            // console.log(
            //     `Reported viewing for item ${itemId} in session ${sessionId} with response:`,
            //     response
            // );

            return itemId;
        },
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        meta: {
            silentFail: true,
        },
    });

    return { reportViewing, isReporting: isPending };
}
