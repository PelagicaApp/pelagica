import { getPrimaryImageUrl, type RecommendationEntry } from '@pelagica/core';
import { getItemLink } from '../lib/getItemLink';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import FocusableCard from './FocusableCard';
import { cn } from '../lib/utils';
import { FOCUS_RING_LARGE } from '../lib/focus-styles';
import { memo, useState } from 'react';
import { ImageOff, Star, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from './ui/badge';

interface RecommendedItemCardProps {
    recommendation: RecommendationEntry;
    showSimilarity: boolean;
}

const RecommendedItemCard = memo(function RecommendedItemCard({
    recommendation,
    showSimilarity,
}: RecommendedItemCardProps) {
    const { t } = useTranslation('item');
    const { item, similarity } = recommendation;
    const [imageError, setImageError] = useState(false);
    const imageSrc = getPrimaryImageUrl(item.id!, {
        width: 416,
        height: 640,
    });

    return (
        <FocusableCard
            to={getItemLink(item.type as BaseItemKind, item.id)}
            className="w-40 relative"
        >
            {(focused) => (
                <>
                    <div
                        className={cn(
                            'aspect-2/3 w-full overflow-hidden rounded-md border border-border bg-muted',
                            focused && FOCUS_RING_LARGE
                        )}
                    >
                        {imageError || !imageSrc ? (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : (
                            <img
                                src={imageSrc}
                                alt={item.name || t('unknown_item')}
                                className="h-full w-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        )}
                    </div>
                    {showSimilarity && (
                        <Badge
                            variant={'secondary'}
                            className={`absolute top-2 left-2 z-20 ${
                                similarity >= 0.6
                                    ? 'text-green-400'
                                    : similarity >= 0.3
                                      ? 'text-yellow-400'
                                      : 'text-red-400'
                            }`}
                        >
                            <TrendingUp />
                            {(similarity * 100).toFixed(0)}%
                        </Badge>
                    )}
                    <p className="mt-2 truncate text-sm font-medium">{item.name}</p>
                    <div>
                        {item.communityRating && (
                            <span className="text-xs text-muted-foreground mr-3 flex items-center gap-1">
                                <Star />
                                {item.communityRating.toFixed(1)}
                            </span>
                        )}
                    </div>
                </>
            )}
        </FocusableCard>
    );
});

export default RecommendedItemCard;
