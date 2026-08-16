import { useQuery } from '@tanstack/react-query';

const fetchServerAddress = async (): Promise<string> => {
    const response = await fetch('/api/server-address');
    if (!response.ok) return '';
    const data: { serverAddress?: string } = await response.json();
    return data.serverAddress || '';
};

export const useServerAddress = () => {
    const { data } = useQuery({
        queryKey: ['server-address'],
        queryFn: fetchServerAddress,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    return data ?? '';
};
