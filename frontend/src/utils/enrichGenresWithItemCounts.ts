import { getApi } from '@/api/getApi';
import type { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';

/** Genre rows enriched for sidebar browse — includes a scoped cover item for thumbnails. */
export type SidebarGenreItem = BaseItemDto & {
    SidebarCoverItemId?: string;
    SidebarCoverImageTag?: string;
};

const enrichmentCache = new Map<
    string,
    { count: number; cover?: { itemId: string; imageTag?: string } }
>();

function cacheKey(genreId: string, includeItemTypes: BaseItemKind[], parentId?: string | null) {
    return `${genreId}:${parentId ?? 'global'}:${includeItemTypes.slice().sort().join(',')}`;
}

function withCoverFields(
    genre: BaseItemDto,
    count: number,
    cover?: { itemId: string; imageTag?: string }
): SidebarGenreItem {
    return {
        ...genre,
        ChildCount: count,
        ...(cover
            ? {
                  SidebarCoverItemId: cover.itemId,
                  SidebarCoverImageTag: cover.imageTag,
              }
            : {}),
    };
}

export async function enrichGenresWithItemCounts(
    genres: BaseItemDto[],
    includeItemTypes: BaseItemKind[],
    parentId?: string | null
): Promise<SidebarGenreItem[]> {
    if (genres.length === 0) return genres;

    const api = getApi();
    const itemsApi = getItemsApi(api);

    return Promise.all(
        genres.map(async (genre) => {
            if (!genre.Id) return genre;

            const key = cacheKey(genre.Id, includeItemTypes, parentId);
            const cached = enrichmentCache.get(key);
            if (cached !== undefined) {
                return withCoverFields(genre, cached.count, cached.cover);
            }

            try {
                const response = await itemsApi.getItems({
                    limit: 1,
                    genreIds: [genre.Id],
                    includeItemTypes,
                    recursive: true,
                    excludeItemTypes: ['CollectionFolder'],
                    ...(parentId ? { parentId } : {}),
                });

                const count = response.data?.TotalRecordCount ?? 0;
                const coverItem = response.data?.Items?.[0];
                const cover =
                    coverItem?.Id != null
                        ? {
                              itemId: coverItem.Id,
                              imageTag: coverItem.ImageTags?.Primary,
                          }
                        : undefined;

                enrichmentCache.set(key, { count, cover });

                return withCoverFields(genre, count, cover);
            } catch {
                return genre;
            }
        })
    );
}
