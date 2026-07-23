import { getApi } from '@/api/getApi';
import { getAccessToken, getServerUrl } from '@/utils/localstorageCredentials';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface StudioSummary {
    id: string;
    name: string;
    count: number;
    hasThumb?: boolean;
}

export interface StudiosResult {
    items: StudioSummary[];
    totalCount: number;
}

const EMPTY_RESULT: StudiosResult = { items: [], totalCount: 0 };

const DIRECT_JELLYFIN_PAGE_SIZE = 300;

interface StudiosQueryOptions {
    limit: number;
    startIndex: number;
    search: string;
}

async function fetchStudiosDirectlyFromJellyfin({
    limit,
    startIndex,
    search,
}: StudiosQueryOptions): Promise<StudiosResult> {
    const api = getApi();
    const itemsApi = getItemsApi(api);

    const counts = new Map<string, StudioSummary>();
    let pageStart = 0;

    for (;;) {
        const response = await itemsApi.getItems({
            recursive: true,
            includeItemTypes: ['Movie', 'Series'],
            fields: ['Studios'],
            enableImages: false,
            startIndex: pageStart,
            limit: DIRECT_JELLYFIN_PAGE_SIZE,
        });

        const items = response.data.Items ?? [];
        for (const item of items) {
            for (const studio of item.Studios ?? []) {
                if (!studio.Id || !studio.Name) continue;

                const existing = counts.get(studio.Id);
                if (existing) {
                    existing.count++;
                } else {
                    counts.set(studio.Id, { id: studio.Id, name: studio.Name, count: 1 });
                }
            }
        }

        pageStart += items.length;
        if (items.length === 0 || items.length < DIRECT_JELLYFIN_PAGE_SIZE) break;
    }

    let studios = Array.from(counts.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
    });

    if (search) {
        const query = search.toLowerCase();
        studios = studios.filter((studio) => studio.name.toLowerCase().includes(query));
    }

    const totalCount = studios.length;
    const clampedStart = Math.min(startIndex, totalCount);

    return {
        items: studios.slice(clampedStart, clampedStart + limit),
        totalCount,
    };
}

const BACKEND_AVAILABLE_QUERY_KEY = ['studios', 'backend-available'];

async function checkStudiosBackendAvailable(): Promise<boolean> {
    try {
        const response = await fetch('/api/studios/health');
        if (!response.ok) return false;
        const data = (await response.json()) as { ok?: boolean };
        return data.ok === true;
    } catch {
        return false;
    }
}

export function useStudiosBackendAvailable() {
    return useQuery({
        queryKey: BACKEND_AVAILABLE_QUERY_KEY,
        queryFn: checkStudiosBackendAvailable,
        staleTime: Infinity,
        retry: false,
    });
}

async function fetchStudiosFromBackend({
    limit,
    startIndex,
    search,
}: StudiosQueryOptions): Promise<StudiosResult> {
    const server = getServerUrl();
    const token = getAccessToken();

    if (!server || !token) {
        return EMPTY_RESULT;
    }

    const params = new URLSearchParams({
        jellyfin_url: server,
        limit: String(limit),
        startIndex: String(startIndex),
    });
    if (search) params.set('search', search);

    const response = await fetch(`/api/studios?${params.toString()}`, {
        headers: {
            Authorization: token,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch studios');
    }

    return (await response.json()) as StudiosResult;
}

interface UseStudiosByItemCountOptions {
    limit?: number;
    hasThumb?: boolean;
    startIndex?: number;
    search?: string;
}

export function useStudiosByItemCount({
    limit = 20,
    startIndex = 0,
    search = '',
}: UseStudiosByItemCountOptions = {}) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['studios', 'byItemCount', limit, startIndex, search],
        queryFn: async (): Promise<StudiosResult> => {
            const server = getServerUrl();
            const token = getAccessToken();
            if (!server || !token) {
                return EMPTY_RESULT;
            }

            const backendAvailable = await queryClient.fetchQuery({
                queryKey: BACKEND_AVAILABLE_QUERY_KEY,
                queryFn: checkStudiosBackendAvailable,
                staleTime: Infinity,
            });

            const options: StudiosQueryOptions = { limit, startIndex, search };
            return backendAvailable
                ? fetchStudiosFromBackend(options)
                : fetchStudiosDirectlyFromJellyfin(options);
        },
        staleTime: 10 * 60 * 1000,
    });
}
