import { getApi } from '../../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../../utils/authErrorHandler';

export interface ItemImage {
    type: ImageType;
    index: number;
    size?: {
        height?: number;
        width?: number;
    };
    tag?: string;
}

export function useItemImages(itemId: string | null | undefined) {
    return useQuery<ItemImage[]>({
        queryKey: ['itemImages', itemId],
        queryFn: async (): Promise<ItemImage[]> => {
            const api = getApi();
            const imageApi = getImageApi(api);

            const imageInfoResponse = await imageApi.getItemImageInfos({ itemId: itemId! });

            const images: ItemImage[] = [];

            if (imageInfoResponse?.data) {
                imageInfoResponse.data.forEach((info) => {
                    if (info.ImageType) {
                        images.push({
                            type: info.ImageType as ImageType,
                            index: info.ImageIndex || 0,
                            tag: (info.ImageTag as string) || undefined,
                            size: {
                                width: info.Width || undefined,
                                height: info.Height || undefined,
                            },
                        });
                    }
                });
            }

            return images;
        },
        enabled: !!itemId,
        ...getRetryConfig(),
    });
}
