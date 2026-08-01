import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logoutFromSeerr } from '@/api/seerr/logout';

export function useSeerrLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logoutFromSeerr,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seerrLoginStatus'] });
        },
    });
}
