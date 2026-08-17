/**
 * Shared short-lived cache for Jellyfin single-item lookups.
 *
 * Use this instead of calling UserLibraryApi.getItem() directly when
 * retrieving normal item/UserData metadata.
 *
 * Mutations that alter item metadata or UserData must call
 * invalidateItemCache(itemId) after succeeding.
 *
 * Do not use this for queries requiring explicit field sets unless
 * the cache is extended to account for those fields.
 */
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getApi } from './getApi';

type CacheEntry = {
    value: BaseItemDto;
    expiresAt: number;
};

const CACHE_TTL_MS = 30_000;

const itemCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<BaseItemDto>>();

function getCacheKey(itemId: string, userId?: string): string {
    return `${userId ?? 'current-user'}:${itemId}`;
}

export async function getItemCached(
    itemId: string,
    userId?: string
): Promise<BaseItemDto> {
    const cacheKey = getCacheKey(itemId, userId);
    const now = Date.now();

    const cached = itemCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
        return cached.value;
    }

    if (cached) {
        itemCache.delete(cacheKey);
    }

    const existingRequest = inFlightRequests.get(cacheKey);

    if (existingRequest) {
        return existingRequest;
    }

    const request = getUserLibraryApi(getApi())
        .getItem({
            itemId,
            ...(userId ? { userId } : {}),
        })
        .then((response) => {
            const item = response.data;
            itemCache.set(cacheKey, {
                value: item,
                expiresAt: Date.now() + CACHE_TTL_MS,
            });
            return item;
        })
        .finally(() => {
            inFlightRequests.delete(cacheKey);
        });
  
    inFlightRequests.set(cacheKey, request);
  
    return request;
}

export function invalidateItemCache(itemId?: string): void {
    if (!itemId) {
        itemCache.clear();
        return;
    }

    for (const key of itemCache.keys()) {
        if (key.endsWith(`:${itemId}`)) {
            itemCache.delete(key);
        }
    }
}
