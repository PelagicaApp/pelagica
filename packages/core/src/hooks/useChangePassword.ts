import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { getApi } from '../api/getApi';

interface ChangePasswordInput {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export function useChangePassword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, currentPassword, newPassword }: ChangePasswordInput) => {
            const api = getApi();
            await getUserApi(api).updateUserPassword({
                userId,
                updateUserPassword: {
                    CurrentPw: currentPassword,
                    NewPw: newPassword,
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
    });
}
