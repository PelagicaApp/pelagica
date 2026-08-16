import { getUserId, useBoxSetItems, useItem } from '@pelagica/core';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ItemHero from '../components/ItemHero';
import FavoriteButton from '../components/FavoriteButton';
import ItemRow from '../components/ItemRow';
import PlayButton from '../components/PlayButton';

const BoxSetDetail = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const { t } = useTranslation('item');
    const { data: item, isLoading } = useItem(itemId, true, getUserId() ?? undefined);
    const { data: boxSetItems, isLoading: isBoxSetItemsLoading } = useBoxSetItems(item?.Id);

    return (
        <div className="flex flex-col gap-6">
            <ItemHero
                item={item}
                isLoading={isLoading}
                mainButtonRow={
                    item && (
                        <>
                            <PlayButton item={item} />
                            <FavoriteButton item={item} />
                        </>
                    )
                }
            />
            <ItemRow
                title={t('boxSetItems')}
                items={boxSetItems ?? []}
                isLoading={isLoading || isBoxSetItemsLoading}
            />
        </div>
    );
};

export default BoxSetDetail;
