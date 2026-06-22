import ScrollableSectionPoster from '@/components/ScrollableSectionPoster';
import SectionScroller from '@/components/SectionScroller';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useRecommendedItems,
    type RecommendationTypeFilter,
} from '@/hooks/api/useRecommendedItems';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { Star, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

interface RecommendedItemsRowProps {
    title?: string;
    type?: RecommendationTypeFilter;
    limit?: number;
    showSimilarity?: boolean;
    showBasedOn?: boolean;
}

const RecommendedItemsRow = ({
    title,
    type = 'all',
    limit = 20,
    showSimilarity = true,
    showBasedOn = false,
}: RecommendedItemsRowProps) => {
    const { t } = useTranslation('home');
    const { data: recommendedItems, isLoading, error } = useRecommendedItems({ type, limit });

    const posterUrls = useMemo(() => {
        if (!recommendedItems) return {};
        return recommendedItems.data.reduce(
            (acc, item) => {
                acc[item.item.id!] = getPrimaryImageUrl(item.item.id!, {
                    width: 416,
                    height: 640,
                });
                return acc;
            },
            {} as Record<string, string>
        );
    }, [recommendedItems]);

    const basedOnPosterUrls = useMemo(() => {
        if (!recommendedItems) return {};
        return recommendedItems.data.reduce(
            (acc, item) => {
                item.basedOn.forEach((basedOnItem) => {
                    acc[basedOnItem.id!] = getPrimaryImageUrl(basedOnItem.id!, {
                        width: 208,
                        height: 320,
                    });
                });
                return acc;
            },
            {} as Record<string, string>
        );
    }, [recommendedItems]);

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
            <SectionScroller
                className="max-w-full"
                title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
                items={
                    recommendedItems
                        ? recommendedItems.data.map((item) => (
                              <ScrollableSectionPoster
                                  key={item.item.id}
                                  itemId={item.item.id}
                                  itemName={item.item.name}
                                  posterUrl={posterUrls[item.item.id!]}
                                  className="relative w-min"
                              >
                                  {showSimilarity && (
                                      <Badge
                                          variant={'secondary'}
                                          className={`absolute top-2 left-2 z-20 ${
                                              item.similarity >= 0.6
                                                  ? 'text-green-400'
                                                  : item.similarity >= 0.3
                                                    ? 'text-yellow-400'
                                                    : 'text-red-400'
                                          }`}
                                      >
                                          <TrendingUp />
                                          {(item.similarity * 100).toFixed(0)}%
                                      </Badge>
                                  )}
                                  {showBasedOn && item.basedOn.length > 0 ? (
                                      <>
                                          <p className="mb-1 text-xs text-muted-foreground">
                                              {t('because_you_watched')}
                                          </p>
                                          <div className="flex gap-3">
                                              {item.basedOn.map((basedOnItem) => (
                                                  <Link
                                                      to={`/item/${basedOnItem.id}`}
                                                      key={basedOnItem.id}
                                                      className="w-1/3"
                                                      title={basedOnItem.name}
                                                  >
                                                      <img
                                                          key={basedOnItem.id}
                                                          src={basedOnPosterUrls[basedOnItem.id!]}
                                                          alt={basedOnItem.name + ' Poster'}
                                                          className="w-full object-cover rounded"
                                                      />
                                                  </Link>
                                              ))}
                                          </div>
                                      </>
                                  ) : (
                                      <div>
                                          {item.item.communityRating && (
                                              <span className="text-xs text-muted-foreground mr-3 flex items-center gap-1">
                                                  <Star size={14} />
                                                  {item.item.communityRating.toFixed(1)}
                                              </span>
                                          )}
                                      </div>
                                  )}
                              </ScrollableSectionPoster>
                          ))
                        : Array.from({ length: 5 }).map((_, index) => (
                              <div key={index} className="w-36 lg:w-44 2xl:w-52">
                                  <Skeleton className="w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80 rounded-md mb-2" />
                                  <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-1" />
                                  <Skeleton className="w-20 lg:w-24 2xl:w-28 h-3" />
                              </div>
                          ))
                }
                contentInset={true}
            />
        )
    );
};

export default RecommendedItemsRow;
