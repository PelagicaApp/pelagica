import { fetchThemesRepository, type ThemesRepository } from '../../api/repositoryThemes';
import { useQuery } from '@tanstack/react-query';

export function useThemesRepository() {
    return useQuery<ThemesRepository>({
        queryKey: ['themesRepository'],
        queryFn: async (): Promise<ThemesRepository> => {
            return fetchThemesRepository();
        },
    });
}
