import { useState } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import {
    getLibraryItemsOptions,
    getUserId,
    useArtistItems,
    useArtistTracks,
    useLibraryItems,
    usePlaylistItems,
} from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import ItemCardGrid from './ItemCardGrid';
import ItemPagination from './ItemPagination';

const PAGE_SIZE = 50;

const ItemsPage = ({
    items,
    isLoading,
    error,
    totalCount,
    page,
    setPage,
}: {
    items?: BaseItemDto[];
    isLoading: boolean;
    error: unknown;
    totalCount: number;
    page: number;
    setPage: (page: number) => void;
}) => {
    const { t } = useTranslation(['common', 'item']);
    return (
        <div className="flex flex-col gap-6">
            {error ? (
                <p role="alert" className="text-muted-foreground">
                    {t('item:item_not_found')}
                </p>
            ) : (
                <>
                    <ItemCardGrid items={items} isLoading={isLoading} />
                    {!isLoading && totalCount === 0 && (
                        <p className="text-muted-foreground">{t('no_results_found')}</p>
                    )}
                    <ItemPagination
                        totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
};

const ArrayContents = ({
    items,
    isLoading,
    error,
}: {
    items?: BaseItemDto[];
    isLoading: boolean;
    error: unknown;
}) => {
    const [page, setPage] = useState(0);
    return (
        <ItemsPage
            items={items?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)}
            isLoading={isLoading}
            error={error}
            totalCount={items?.length ?? 0}
            page={page}
            setPage={setPage}
        />
    );
};

const PlaylistContents = ({ item }: { item: BaseItemDto }) => {
    const { data, isLoading, error } = usePlaylistItems(item.Id, getUserId());
    return <ArrayContents items={data} isLoading={isLoading} error={error} />;
};

const ArtistContents = ({ item }: { item: BaseItemDto }) => {
    const { t } = useTranslation(['common', 'item']);
    const [page, setPage] = useState(0);
    const albums = useArtistItems(item.Id ?? '', {
        sortBy: ['SortName'],
        sortOrder: ['Ascending'],
        limit: PAGE_SIZE,
        startIndex: page * PAGE_SIZE,
    });
    const tracks = useArtistTracks(item.Id);
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold">{t('albums')}</h2>
            <ItemsPage
                items={albums.data?.items ?? undefined}
                isLoading={albums.isLoading}
                error={albums.error}
                totalCount={albums.data?.totalCount ?? 0}
                page={page}
                setPage={setPage}
            />
            <h2 className="text-xl font-semibold">{t('item:audio')}</h2>
            <ArrayContents items={tracks.data} isLoading={tracks.isLoading} error={tracks.error} />
        </div>
    );
};

const FolderContents = ({ item }: { item: BaseItemDto }) => {
    const [page, setPage] = useState(0);
    const { data, isLoading, error } = useLibraryItems(item.Id, {
        ...getLibraryItemsOptions(),
        limit: PAGE_SIZE,
        startIndex: page * PAGE_SIZE,
        sortBy:
            item.Type === 'MusicAlbum' || item.Type === 'Season'
                ? ['ParentIndexNumber', 'IndexNumber', 'SortName']
                : ['SortName'],
        sortOrder: 'Ascending',
    });
    return (
        <ItemsPage
            items={data?.items}
            isLoading={isLoading}
            error={error}
            totalCount={data?.totalCount ?? 0}
            page={page}
            setPage={setPage}
        />
    );
};

const ItemContents = ({ item }: { item: BaseItemDto }) => {
    if (item.Type === 'Playlist') return <PlaylistContents item={item} />;
    if (item.Type === 'MusicArtist') return <ArtistContents item={item} />;
    return <FolderContents item={item} />;
};

export default ItemContents;
