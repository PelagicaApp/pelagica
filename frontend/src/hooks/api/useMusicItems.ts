import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';
import { getUserId } from '@/utils/localstorageCredentials';

export function useRecentlyAddedAlbums(limit = 10) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['recentlyAddedAlbums', limit],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['MusicAlbum'],
                sortBy: ['DateCreated'],
                sortOrder: ['Descending'],
                limit,
                recursive: true,
                fields: ['PrimaryImageAspectRatio'],
                enableUserData: true,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        ...getRetryConfig(),
    });
}

export function useRecentlyPlayedSongs(limit = 10) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['recentlyPlayedSongs', limit],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['Audio'],
                sortBy: ['DatePlayed'],
                sortOrder: ['Descending'],
                limit,
                recursive: true,
                fields: ['PrimaryImageAspectRatio', 'MediaSources'],
                enableUserData: true,
                filters: ['IsPlayed'],
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        ...getRetryConfig(),
    });
}

export function useFrequentlyPlayedSongs(limit = 10) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['frequentlyPlayedSongs', limit],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['Audio'],
                sortBy: ['PlayCount'],
                sortOrder: ['Descending'],
                limit,
                recursive: true,
                fields: ['PrimaryImageAspectRatio', 'MediaSources'],
                enableUserData: true,
                filters: ['IsPlayed'],
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        ...getRetryConfig(),
    });
}

export function useFavoriteArtists(limit = 50) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['favoriteArtists', limit],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['MusicArtist'],
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                limit,
                recursive: true,
                isFavorite: true,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        ...getRetryConfig(),
    });
}

export function useFavoriteAlbums(limit = 50) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['favoriteAlbums', limit],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['MusicAlbum'],
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                limit,
                recursive: true,
                isFavorite: true,
                fields: ['PrimaryImageAspectRatio'],
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        ...getRetryConfig(),
    });
}

export function useFavoriteSongs(limit = 50) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['favoriteSongs', limit],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['Audio'],
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                limit,
                recursive: true,
                isFavorite: true,
                fields: ['PrimaryImageAspectRatio', 'MediaSources'],
                enableUserData: true,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        ...getRetryConfig(),
    });
}

export function useAllAlbums(limit = 100, startIndex = 0) {
    return useQuery<{ items: BaseItemDto[]; totalCount: number }>({
        queryKey: ['allAlbums', limit, startIndex],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['MusicAlbum'],
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                limit,
                startIndex,
                recursive: true,
                fields: ['PrimaryImageAspectRatio'],
                locationTypes: ['FileSystem'],
            });
            return {
                items: response.data.Items || [],
                totalCount: response.data.TotalRecordCount || 0,
            };
        },
        ...getRetryConfig(),
    });
}

export function useAllArtists(limit = 100, startIndex = 0) {
    return useQuery<{ items: BaseItemDto[]; totalCount: number }>({
        queryKey: ['allArtists', limit, startIndex],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                includeItemTypes: ['MusicArtist'],
                sortBy: ['SortName'],
                sortOrder: ['Ascending'],
                limit,
                startIndex,
                recursive: true,
                fields: ['PrimaryImageAspectRatio'],
                locationTypes: ['FileSystem'],
            });
            return {
                items: response.data.Items || [],
                totalCount: response.data.TotalRecordCount || 0,
            };
        },
        ...getRetryConfig(),
    });
}

export function useMusicSearch(searchTerm: string, limit = 20) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['musicSearch', searchTerm, limit],
        queryFn: async () => {
            const api = getApi();
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                userId: getUserId() || undefined,
                searchTerm: searchTerm.trim(),
                includeItemTypes: ['Audio', 'MusicAlbum', 'MusicArtist'],
                limit,
                recursive: true,
                fields: ['PrimaryImageAspectRatio', 'MediaSources'],
                enableUserData: true,
                locationTypes: ['FileSystem'],
            });
            return response.data.Items || [];
        },
        enabled: searchTerm.trim().length > 0,
        ...getRetryConfig(),
    });
}
