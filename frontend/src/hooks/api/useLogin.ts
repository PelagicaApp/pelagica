import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApi } from '../../api/jellyfinClient';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { saveCredentials } from '@/utils/localstorageCredentials';
import { loginToSeerr } from '@/api/seerr/login';

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            server,
            username,
            password,
        }: {
            server: string;
            username: string;
            password: string;
        }) => {
            const api = createApi(server);
            const res = await getUserApi(api).authenticateUserByName({
                authenticateUserByName: {
                    Pw: password,
                    Username: username,
                },
            });

            const accessToken = res.data.AccessToken || '';
            const userId = res.data.User?.Id || '';

            saveCredentials(server, userId, accessToken);
            try {
                await loginToSeerr(server, username, password);
            } catch (e) {
                // seerr login is best effort and shouldn't block jellyfin login
                console.warn('Seerr login failed:', e);
            }
            await queryClient.invalidateQueries({ queryKey: ['seerrLoginStatus'] });

            return { api, user: res.data.User };
        },
    });
}
