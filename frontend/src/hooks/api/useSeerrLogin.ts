import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginToSeerr } from '@/api/seerr/login';

export function useSeerrLogin() {
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
            const ok = await loginToSeerr(server, username, password);
            if (!ok) {
                throw new Error('Invalid Seerr credentials');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seerrLoginStatus'] });
        },
    });
}
