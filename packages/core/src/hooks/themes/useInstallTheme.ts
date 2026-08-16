import { installThemeFromRepository } from '../../api/themes';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useInstallTheme() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (themeId: string) => {
            return installThemeFromRepository(themeId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['themes'] });
        },
    });
}
