import { fetchThemeById, type Theme } from '../../api/themes';
import { getServerUrl } from '../../utils/localstorageCredentials';
import { useQuery } from '@tanstack/react-query';

export function useTheme(id: string) {
    return useQuery<Theme>({
        queryKey: ['themes', getServerUrl(), id],
        queryFn: async (): Promise<Theme> => {
            return fetchThemeById(id);
        },
    });
}
