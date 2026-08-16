import { useRecommendedItems, type RecommendationTypeFilter } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import ScrollableHomeSection from './ScrollableHomeSection';
import RecommendedItemCard from '../RecommendedItemCard';

interface RecommendedItemsRowProps {
    title?: string;
    type?: RecommendationTypeFilter;
    limit?: number;
    showSimilarity?: boolean;
}

const RecommendedItemsRow = ({
    title,
    type = 'all',
    limit = 20,
    showSimilarity = true,
}: RecommendedItemsRowProps) => {
    const { t } = useTranslation('home');
    const { data: recommendedItems, isLoading, error } = useRecommendedItems({ type, limit });

    if (error) {
        console.error('Error fetching recommended items:', error);
        return null;
    }

    if (!recommendedItems || recommendedItems.data.length === 0) {
        console.warn('No recommended items found.');
        return null;
    }

    return (
        ((recommendedItems && recommendedItems.data.length > 0) || isLoading) && (
            <ScrollableHomeSection title={title || t('recommended_items')}>
                {recommendedItems.data.map((recom) => (
                    <RecommendedItemCard
                        key={recom.item.id}
                        recommendation={recom}
                        showSimilarity={showSimilarity}
                    />
                ))}
            </ScrollableHomeSection>
        )
    );
};

export default RecommendedItemsRow;
