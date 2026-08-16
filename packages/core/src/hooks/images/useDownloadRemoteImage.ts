import { getApi } from '../../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getRemoteImageApi } from '@jellyfin/sdk/lib/utils/api';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models';

export interface DownloadRemoteImageParams {
    itemId: string;
    imageType: ImageType;
    imageUrl: string;
    imageIndex?: number;
}

export function useDownloadRemoteImage() {
    const queryClient = useQueryClient();

    const { mutate: downloadImage, isPending: isDownloading } = useMutation({
        mutationFn: async ({ itemId, imageType, imageUrl }: DownloadRemoteImageParams) => {
            const api = getApi();
            const remoteImageApi = getRemoteImageApi(api);

            await remoteImageApi.downloadRemoteImage({
                itemId,
                type: imageType,
                imageUrl,
            });
        },
        onSuccess: (_, { itemId }) => {
            queryClient.invalidateQueries({ queryKey: ['itemImages', itemId] });
        },
    });

    return { downloadImage, isDownloading };
}
