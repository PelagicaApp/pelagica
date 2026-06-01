import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTheme } from '@/api/themes';

export function useCreateTheme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (themeJson: string) => {
            return createTheme(themeJson);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['themes'] });
        },
    });
}
