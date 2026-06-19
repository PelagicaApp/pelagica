import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { memo } from 'react';
import Page from '../Page';
import { useItem } from '@/hooks/api/useItem';
import { useConfig } from '@/hooks/api/useConfig';
import { useGenreItems } from '@/hooks/api/genres/useGenreItems';
import { getUserId } from '@/utils/localstorageCredentials';
import { Skeleton } from '@/components/ui/skeleton';
import WatchedStateBadge from '@/components/WatchedStateBadge';
import ItemsListPage from '@/components/ItemsListPage';

const GRID_COLS =
    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9';

const GenrePageSkeleton = memo(() => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <Skeleton className="h-8 w-48 rounded-md" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
            </div>
        </div>
        <div className={`w-full gap-4 grid ${GRID_COLS}`}>
            {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}>
                    <Skeleton className="w-full aspect-2/3 rounded-md" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                    <Skeleton className="mt-1 h-3 w-1/4" />
                </div>
            ))}
        </div>
    </div>
));

GenrePageSkeleton.displayName = 'GenrePageSkeleton';

const GenrePage = () => {
    const { t } = useTranslation('item');
    const { itemId } = useParams<{ itemId: string }>();
    const { data: item, isLoading, error } = useItem(itemId, true, getUserId() || undefined);
    const { config, loading: configLoading } = useConfig();

    return (
        <Page
            title={item ? `${item.Name}` : isLoading ? t('loading') : t('item_not_found')}
            pagePadding
        >
            {(isLoading || configLoading) && <GenrePageSkeleton />}
            {error && <p>Error loading item details.</p>}
            {item && (
                <ItemsListPage
                    item={item}
                    useItems={useGenreItems}
                    renderItemOverlay={(child) => (
                        <WatchedStateBadge
                            item={child}
                            show={config?.watchedStateBadgeGenre || false}
                        />
                    )}
                />
            )}
        </Page>
    );
};

export default GenrePage;
