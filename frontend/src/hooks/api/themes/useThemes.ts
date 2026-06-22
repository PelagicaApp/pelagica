import { fetchThemes, type ThemeSummary } from '@/api/themes';
import { useQuery } from '@tanstack/react-query';

export function useThemes() {
    return useQuery<ThemeSummary[]>({
        queryKey: ['themes'],
        queryFn: async (): Promise<ThemeSummary[]> => {
            return fetchThemes();
        },
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
    });
}
