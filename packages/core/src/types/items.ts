import type {
    BaseItemDto,
    BaseItemDtoQueryResult,
    CollectionType,
    CollectionTypeOptions,
    ItemSortBy,
    SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models';

/** Library responses and library creation options use different generated SDK enums. */
export type LibraryCollectionType = CollectionType | CollectionTypeOptions;

export type LibraryView = Omit<BaseItemDto, 'CollectionType'> & {
    CollectionType?: LibraryCollectionType | null;
};

export type LibraryViewsQueryResult = Omit<BaseItemDtoQueryResult, 'Items'> & {
    Items?: LibraryView[] | null;
};

export interface ItemsQueryParams {
    sortBy: ItemSortBy[];
    sortOrder: SortOrder[];
    limit: number;
    startIndex: number;
}

export interface ItemsQueryResult {
    data:
        | {
              items?: BaseItemDto[] | null;
              totalCount?: number | null;
          }
        | undefined;
    isLoading: boolean;
    error: unknown;
}
