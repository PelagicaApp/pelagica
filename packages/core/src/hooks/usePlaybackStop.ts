import { getApi } from '../api/getApi';
import { useMutation } from '@tanstack/react-query';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { useCurrentSessionId } from './useCurrentSessionId';

interface StopPlayback {
    itemId: string;
    positionTicks: number;
}

export function usePlaybackStop() {
    const { data: sessionId } = useCurrentSessionId();

    const { mutate: stopPlayback, isPending } = useMutation({
        mutationFn: async ({ itemId, positionTicks }: StopPlayback) => {
            if (!itemId) throw new Error('Item ID is required');
            if (!sessionId) return;

            const api = getApi();
            const playstateApi = getPlaystateApi(api);

            await playstateApi.reportPlaybackStopped({
                playbackStopInfo: {
                    ItemId: itemId,
                    SessionId: sessionId,
                    PositionTicks: positionTicks,
                },
            });

            // console.log(
            //     `Stopped playback for item ${itemId} at position ${positionTicks} in session ${sessionId}`
            // );

            return itemId;
        },
        meta: {
            silentFail: true,
        },
    });

    return { stopPlayback, isStopping: isPending };
}
