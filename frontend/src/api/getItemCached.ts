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

export async function getItemCached(itemId: string): Promise<BaseItemDto> {
  const now = Date.now();

  const cached = itemCache.get(itemId);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached) {
    itemCache.delete(itemId);
  }

  const existingRequest = inFlightRequests.get(itemId);

  if (existingRequest) {
    return existingRequest;
  }

  const request = getUserLibraryApi(getApi())
    .getItem({
      itemId,
    })
    .then((response) => {
      const item = response.data;

      itemCache.set(itemId, {
        value: item,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return item;
    })
    .finally(() => {
      inFlightRequests.delete(itemId);
    });

  inFlightRequests.set(itemId, request);

  return request;
}

export function invalidateItemCache(itemId?: string) {
  if (itemId) {
    itemCache.delete(itemId);
    return;
  }

  itemCache.clear();
}
