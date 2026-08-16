import { deleteTheme } from '../../api/themes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteTheme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (themeId: string) => {
            return deleteTheme(themeId);
        },
        onSuccess: (_, themeId) => {
            queryClient.invalidateQueries({ queryKey: ['themes'] });
            queryClient.invalidateQueries({ queryKey: ['theme', themeId] });
        },
    });
}
