import { getApi } from '../../api/getApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import type { UserConfiguration } from '@jellyfin/sdk/lib/generated-client/models';

interface UpdateUserConfigurationInput {
    userId: string;
    playbackPreferences: Partial<UserConfiguration>;
}

export function useUpdateUserConfiguration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateUserConfigurationInput) => {
            const api = getApi();
            const userApi = getUserApi(api);

            const userResponse = await userApi.getUserById({
                userId: input.userId,
            });

            const existingConfig = userResponse.data.Configuration;
            if (!existingConfig) {
                throw new Error('User configuration not found');
            }

            const updatedConfig: UserConfiguration = {
                ...existingConfig,
                ...input.playbackPreferences,
            };

            await userApi.updateUserConfiguration({
                userId: input.userId,
                userConfiguration: updatedConfig,
            });
        },

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['userConfiguration', variables.userId],
            });
            queryClient.invalidateQueries({
                queryKey: ['currentUser'],
            });
        },
    });
}
