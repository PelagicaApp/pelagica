import { getApi } from '../../api/getApi';
import { useMutation } from '@tanstack/react-query';
import { getRemoteImageApi } from '@jellyfin/sdk/lib/utils/api';
import type { ImageType, RemoteImageInfo } from '@jellyfin/sdk/lib/generated-client/models';

export interface SearchRemoteImagesParams {
    itemId: string;
    imageType: ImageType;
    includeAllLanguages?: boolean;
}

export function useSearchRemoteImages() {
    const {
        mutate: searchImages,
        isPending: isSearching,
        data: results,
    } = useMutation({
        mutationFn: async ({
            itemId,
            imageType,
            includeAllLanguages = false,
        }: SearchRemoteImagesParams): Promise<RemoteImageInfo[]> => {
            const api = getApi();
            const remoteImageApi = getRemoteImageApi(api);

            const response = await remoteImageApi.getRemoteImages({
                itemId,
                type: imageType,
                includeAllLanguages,
            });

            return response.data.Images || [];
        },
    });

    return { searchImages, isSearching, results };
}
