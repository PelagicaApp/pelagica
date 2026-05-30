import { useParams } from 'react-router';
import Page from '../Page';
import { useItem } from '@/hooks/api/useItem';
import MoviePage from './MoviePage';
import SeriesPage from './SeriesPage';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@/hooks/api/useConfig';
import EpisodePage from './EpisodePage';
import SeasonPage from './SeasonPage';
import { getUserId } from '@/utils/localstorageCredentials';
import BoxSetPage from './BoxSetPage';
import MusicAlbumPage from './MusicAlbumPage';
import PlaylistPage from './PlaylistPage';
import GenrePage from './GenrePage';
import StudioPage from './StudioPage';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';

const ItemPageSkeleton = memo(() => {
    return (
        <div className="relative h-full w-full">
            {/* banner */}
            <div className="absolute top-0 left-0 h-3/4 w-full -z-10">
                <Skeleton className="h-full w-full rounded-md border border-border" />
                <div className="absolute bottom-0 left-0 h-full w-full px-4 bg-linear-to-t from-background to-transparent rounded-md" />
            </div>

            {/* logo */}
            <div className="h-2/5 flex items-center justify-center">
                <Skeleton className="relative mx-auto px-4 h-32 w-48 object-contain rounded-md" />
            </div>

            {/* main content */}
            <div className="relative z-10 p-2 sm:p-4">
                <div className="bg-background/30 backdrop-blur-md p-4 sm:p-8 rounded-md w-full flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row gap-6 max-w-7xl">
                        {/* poster */}
                        <div className="relative w-60 min-w-60 h-90 sm:w-72 sm:min-w-72 sm:h-108 hidden sm:block">
                            <Skeleton className="w-full h-full rounded-md" />
                        </div>

                        <div className="flex flex-col gap-3 flex-1">
                            {/* title */}
                            <Skeleton className="h-12 w-3/4 rounded-md" />

                            {/* top badges */}
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-8 w-20 rounded-md" />
                                <Skeleton className="h-8 w-16 rounded-md" />
                                <Skeleton className="h-8 w-12 rounded-md" />
                            </div>

                            {/* play button */}
                            <Skeleton className="h-10 w-32 rounded-md" />

                            {/* overview */}
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full rounded-md" />
                                <Skeleton className="h-4 w-full rounded-md" />
                                <Skeleton className="h-4 w-2/3 rounded-md" />
                            </div>

                            {/* bottom items */}
                            <div className="space-y-3 pt-2">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-6 w-24 rounded-md" />
                                        <Skeleton className="h-6 w-32 rounded-md" />
                                        <Skeleton className="h-6 w-20 rounded-md" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-6 w-28 rounded-md" />
                                        <Skeleton className="h-6 w-24 rounded-md" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-6 w-32 rounded-md" />
                                        <Skeleton className="h-6 w-28 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ItemPageSkeleton.displayName = 'ItemPageSkeleton';

const FULL_PAGE_ITEM_TYPES: BaseItemKind[] = ['Movie', 'Series', 'Episode', 'Season', 'BoxSet'];

const ItemPage = () => {
    const { t } = useTranslation('item');
    const params = useParams<{ itemId: string }>();
    const itemId = params.itemId;

    const { config, loading: configLoading } = useConfig();
    const { data: item, isLoading, error } = useItem(itemId, true, getUserId() || undefined);

    const isFullPageItem = item && FULL_PAGE_ITEM_TYPES.includes(item.Type as BaseItemKind);

    return (
        <Page
            title={item ? `${item.Name}` : isLoading ? t('loading') : t('item_not_found')}
            className="flex-1 flex flex-col"
            overlayHeader={isFullPageItem}
            pagePadding={!isFullPageItem}
        >
            {(isLoading || configLoading) && <ItemPageSkeleton />}
            {error && <p>Error loading item details.</p>}
            {item &&
                (() => {
                    switch (item.Type) {
                        case 'Movie':
                            return <MoviePage item={item} config={config} />;
                        case 'Series':
                            return <SeriesPage item={item} config={config} />;
                        case 'Episode':
                            return <EpisodePage item={item} config={config} />;
                        case 'Season':
                            return <SeasonPage item={item} config={config} />;
                        case 'BoxSet':
                            return <BoxSetPage item={item} config={config} />;
                        case 'MusicAlbum':
                            return <MusicAlbumPage item={item} config={config} />;
                        case 'Playlist':
                            return <PlaylistPage item={item} config={config} />;
                        case 'Genre':
                            return <GenrePage item={item} />;
                        case 'Studio':
                            return <StudioPage item={item} />;
                        default:
                            return (
                                <p>
                                    Unsupported item type "{item.Type}" for item "{item.Name}" with
                                    ID "{item.Id}"
                                </p>
                            );
                    }
                })()}
        </Page>
    );
};

export default ItemPage;
