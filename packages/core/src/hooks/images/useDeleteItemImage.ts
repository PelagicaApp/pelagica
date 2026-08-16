import { getApi } from '../../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models';

export function useDeleteItemImage() {
    const queryClient = useQueryClient();

    const { mutate: deleteImage, isPending: isDeleting } = useMutation({
        mutationFn: async ({
            itemId,
            imageType,
            imageIndex,
        }: {
            itemId: string;
            imageType: ImageType;
            imageIndex: number;
        }) => {
            const api = getApi();
            const imageApi = getImageApi(api);

            await imageApi.deleteItemImage({
                itemId,
                imageType,
                imageIndex,
            });
        },
        onSuccess: (_, { itemId }) => {
            queryClient.invalidateQueries({ queryKey: ['itemImages', itemId] });
        },
    });

    return { deleteImage, isDeleting };
}
