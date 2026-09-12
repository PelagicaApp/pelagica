import { useParams } from '@/router';
import { useTranslation } from 'react-i18next';
import { getUserId, useConfig, useItem, useSimilarItems } from '@pelagica/core';
import ItemHero from '../components/ItemHero';
import PlayButton from '../components/PlayButton';
import WatchlistButton from '../components/WatchlistButton';
import FavoriteButton from '../components/FavoriteButton';
import ItemRow from '../components/ItemRow';
import TrailerButton from '../components/TrailerButton';
import PlayStateButton from '../components/PlayStateButton';
import CollectionRows from '../components/CollectionRows';

const MovieDetail = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const { t } = useTranslation('item');
    const { config } = useConfig();
    const { data: item, isLoading } = useItem(itemId, true, getUserId() ?? undefined);
    const { data: similarItems, isLoading: isSimilarItemsLoading } = useSimilarItems(itemId, 12);

    return (
        <div className="flex flex-col gap-6">
            <ItemHero
                item={item}
                isLoading={isLoading}
                mainButtonRow={
                    item && (
                        <>
                            <PlayButton item={item} />
                            <TrailerButton item={item} />
                            <WatchlistButton item={item} />
                            <FavoriteButton item={item} />
                            <PlayStateButton itemId={item.Id || ''} userId={getUserId() || ''} />
                        </>
                    )
                }
            />

            <CollectionRows itemId={itemId} config={config} />

            <ItemRow
                title={t('more_like_this')}
                items={similarItems ?? []}
                isLoading={isLoading || isSimilarItemsLoading}
            />
        </div>
    );
};

export default MovieDetail;
