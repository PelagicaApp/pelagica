import { getApi } from '../../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api';
import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models';
import { fileToBase64 } from '../../utils/fileToBase64';

export interface UploadItemImageParams {
    itemId: string;
    imageType: ImageType;
    file: File;
    onSuccess?: () => void;
}

export function useUploadItemImage() {
    const queryClient = useQueryClient();

    const { mutate: uploadImage, isPending: isUploading } = useMutation({
        mutationFn: async ({ itemId, imageType, file }: UploadItemImageParams) => {
            const api = getApi();
            const imageApi = getImageApi(api);

            const base64Data = await fileToBase64(file);

            await imageApi.setItemImage(
                {
                    itemId,
                    imageType,
                    body: base64Data as unknown as File,
                },
                {
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                    },
                }
            );
        },
        onSuccess: (_, { itemId, onSuccess }) => {
            queryClient.invalidateQueries({ queryKey: ['itemImages', itemId] });
            if (onSuccess) onSuccess();
        },
    });

    return { uploadImage, isUploading };
}
