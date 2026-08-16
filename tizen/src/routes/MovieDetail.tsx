import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserId, useItem, useSimilarItems } from '@pelagica/core';
import { Badge } from '@/components/ui/badge';
import { formatRuntime } from '@/lib/formatRuntime';
import ItemHero from '../components/ItemHero';
import PlayButton from '../components/PlayButton';
import WatchlistButton from '../components/WatchlistButton';
import FavoriteButton from '../components/FavoriteButton';
import ItemRow from '../components/ItemRow';
import TrailerButton from '../components/TrailerButton';

const MovieDetail = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const { t } = useTranslation('item');
    const { data: item, isLoading } = useItem(itemId, true, getUserId() ?? undefined);
    const { data: similarItems, isLoading: isSimilarItemsLoading } = useSimilarItems(itemId, 12);

    return (
        <div className="flex flex-col gap-6">
            <ItemHero
                item={item}
                isLoading={isLoading}
                extraBadge={
                    item?.RunTimeTicks && (
                        <Badge variant="outline">{formatRuntime(item.RunTimeTicks)}</Badge>
                    )
                }
                mainButtonRow={
                    item && (
                        <>
                            <PlayButton item={item} />
                            <TrailerButton item={item} />
                            <WatchlistButton item={item} />
                            <FavoriteButton item={item} />
                        </>
                    )
                }
            />

            <ItemRow
                title={t('more_like_this')}
                items={similarItems ?? []}
                isLoading={isLoading || isSimilarItemsLoading}
            />
        </div>
    );
};

export default MovieDetail;
