import { fetchThemes, type ThemeSummary } from '../../api/themes';
import { getServerUrl } from '../../utils/localstorageCredentials';
import { useQuery } from '@tanstack/react-query';

export function useThemes() {
    return useQuery<ThemeSummary[]>({
        queryKey: ['themes', getServerUrl()],
        queryFn: async (): Promise<ThemeSummary[]> => {
            return fetchThemes();
        },
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
    });
}
