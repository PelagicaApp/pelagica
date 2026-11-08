import { getApi } from '../../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api';
import { fileToBase64 } from '../../utils/fileToBase64';

export interface UploadUserImageParams {
    userId: string;
    file: File;
}

export function useUploadUserImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, file }: UploadUserImageParams) => {
            const api = getApi();
            const base64Data = await fileToBase64(file);

            await getImageApi(api).postUserImage(
                {
                    userId,
                    body: base64Data as unknown as File,
                },
                {
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                    },
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
    });
}
