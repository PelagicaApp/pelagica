import { getApi } from '@/api/getApi';
import { STUDIOS_REMOTE_JSON_URL } from '@/utils/jellyfinUrls';
import { getAccessToken, getServerUrl } from '@/utils/localstorageCredentials';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface StudioSummary {
    id: string;
    name: string;
    count: number;
    hasThumb?: boolean;
}

const DIRECT_JELLYFIN_PAGE_SIZE = 300;

function normalizeStudioName(name: string): string {
    return name.trim().split(/\s+/).join(' ').toLowerCase();
}

async function fetchStudioThumbNames(): Promise<Set<string>> {
    const response = await fetch(STUDIOS_REMOTE_JSON_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch studio thumbnail list');
    }

    const entries = (await response.json()) as Array<{ name?: string }>;
    return new Set(
        entries
            .map((entry) => entry.name?.trim())
            .filter((name): name is string => !!name)
            .map(normalizeStudioName)
    );
}

async function fetchStudiosDirectlyFromJellyfin(
    limit: number,
    hasThumb: boolean
): Promise<StudioSummary[]> {
    const api = getApi();
    const itemsApi = getItemsApi(api);

    const counts = new Map<string, StudioSummary>();
    let startIndex = 0;

    for (;;) {
        const response = await itemsApi.getItems({
            recursive: true,
            includeItemTypes: ['Movie', 'Series'],
            fields: ['Studios'],
            enableImages: false,
            startIndex,
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

        startIndex += items.length;
        if (items.length === 0 || items.length < DIRECT_JELLYFIN_PAGE_SIZE) break;
    }

    const studios = Array.from(counts.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
    });

    if (!hasThumb) {
        return studios.slice(0, limit);
    }

    const thumbNames = await fetchStudioThumbNames();
    const filtered: StudioSummary[] = [];
    for (const studio of studios) {
        if (!thumbNames.has(normalizeStudioName(studio.name))) continue;
        filtered.push({ ...studio, hasThumb: true });
        if (filtered.length === limit) break;
    }

    return filtered;
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

async function fetchStudiosFromBackend(limit: number, hasThumb: boolean): Promise<StudioSummary[]> {
    const server = getServerUrl();
    const token = getAccessToken();

    if (!server || !token) {
        return [];
    }

    const params = new URLSearchParams({
        jellyfin_url: server,
        limit: String(limit),
        hasThumb: String(hasThumb),
    });

    const response = await fetch(`/api/studios?${params.toString()}`, {
        headers: {
            Authorization: token,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch studios');
    }

    return (await response.json()) as StudioSummary[];
}

export function useStudiosByItemCount(limit: number = 20, hasThumb: boolean = true) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['studios', 'byItemCount', limit, hasThumb],
        queryFn: async () => {
            const server = getServerUrl();
            const token = getAccessToken();
            if (!server || !token) {
                return [] as StudioSummary[];
            }

            const backendAvailable = await queryClient.fetchQuery({
                queryKey: BACKEND_AVAILABLE_QUERY_KEY,
                queryFn: checkStudiosBackendAvailable,
                staleTime: Infinity,
            });

            return backendAvailable
                ? fetchStudiosFromBackend(limit, hasThumb)
                : fetchStudiosDirectlyFromJellyfin(limit, hasThumb);
        },
        staleTime: 10 * 60 * 1000,
    });
}
