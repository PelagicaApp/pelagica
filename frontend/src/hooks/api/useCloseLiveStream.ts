import { getApi } from '@/api/getApi';
import { useMutation } from '@tanstack/react-query';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';

export function useCloseLiveStream() {
    const { mutate: closeLiveStream } = useMutation({
        mutationFn: async (liveStreamId: string) => {
            const api = getApi();
            const mediaInfoApi = getMediaInfoApi(api);
            await mediaInfoApi.closeLiveStream({ liveStreamId });
        },
        meta: {
            silentFail: true,
        },
    });

    return { closeLiveStream };
}
