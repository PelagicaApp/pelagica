import { useParams } from 'react-router';
import { useItem } from '@/hooks/api/useItem';
import { useConfig } from '@/hooks/api/useConfig';
import { useTranslation } from 'react-i18next';
import { getUserId } from '@/utils/localstorageCredentials';
import BaseMusicListPage from '@/pages/Item/BaseMusicListPage';
import { Skeleton } from '@/components/ui/skeleton';
import MusicBackButton from './MusicBackButton';

const MusicAlbumView = () => {
    const { t } = useTranslation('item');
    const { itemId } = useParams<{ itemId: string }>();
    const { data: item, isLoading, error } = useItem(itemId, true, getUserId() || undefined);
    const { config, loading: configLoading } = useConfig();

    if (isLoading || configLoading) {
        return (
            <div className="flex flex-col gap-4 p-4">
                <MusicBackButton />
                <div className="flex gap-4">
                    <Skeleton className="w-32 h-32 rounded-md shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-8 w-64 rounded" />
                        <Skeleton className="h-4 w-48 rounded" />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !item) {
        return <p className="text-muted-foreground p-4">{t('item_not_found')}</p>;
    }

    return (
        <>
            <MusicBackButton />
            <BaseMusicListPage
                item={item}
                config={config}
                listType={t('album')}
                showBackground={false}
            />
        </>
    );
};

export default MusicAlbumView;
