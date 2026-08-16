import {
    getEndsAt,
    ticksToReadableTime,
    useRowItems,
    type DetailField,
    type SectionItemsConfig,
    type TranslateFn,
} from '@pelagica/core';
import { useEffect, type ReactNode } from 'react';
import ScrollableHomeSection from './ScrollableHomeSection';
import ItemCard from '../ItemCard';
import { Skeleton } from '../ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

interface ItemsRowProps {
    title?: string;
    allLink?: string;
    items?: SectionItemsConfig;
    detailFields?: DetailField[];
    useThumbImage?: boolean;
    autoPlayTrailers?: boolean;
}

function getDetailFieldsStringForItem(
    detailField: DetailField,
    item: BaseItemDto,
    t: TranslateFn
): ReactNode {
    switch (detailField) {
        case 'ReleaseYear':
            return item.PremiereDate ? new Date(item.PremiereDate).getFullYear().toString() : '';
        case 'ReleaseYearAndMonth':
            return item.PremiereDate
                ? new Date(item.PremiereDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                  })
                : '';
        case 'ReleaseDate':
            return item.PremiereDate
                ? new Date(item.PremiereDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : '';
        case 'CommunityRating':
            return item.CommunityRating ? (
                <div className="flex items-center gap-1">
                    <Star />
                    {item.CommunityRating.toFixed(1)}
                </div>
            ) : (
                t('rating_unavailable')
            );
        case 'PlayDuration':
            return item.RunTimeTicks
                ? ticksToReadableTime(item.RunTimeTicks)
                : t('duration_unknown');
        case 'PlayEnd':
            return item.RunTimeTicks
                ? t('ends_at', {
                      date: getEndsAt(item.RunTimeTicks).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                      }),
                  })
                : t('ends_at_unknown');
        case 'SeasonCount':
            return item.ChildCount !== undefined && item.ChildCount !== null
                ? item.ChildCount === 1
                    ? t('season_count', { count: item.ChildCount })
                    : t('season_count_plural', { count: item.ChildCount })
                : t('not_available');
        case 'EpisodeCount':
            return item.RecursiveItemCount !== undefined && item.RecursiveItemCount !== null
                ? item.RecursiveItemCount === 1
                    ? t('episode_count', { count: item.RecursiveItemCount })
                    : t('episode_count_plural', { count: item.RecursiveItemCount })
                : t('not_available');
        case 'AgeRating':
            return item.OfficialRating || t('not_rated');
        case 'Artist':
            return item.AlbumArtist || t('unknown_artist');
        case 'TrackCount':
            return item.ChildCount !== undefined && item.ChildCount !== null
                ? item.ChildCount === 1
                    ? t('track_count', { count: item.ChildCount })
                    : t('track_count_plural', { count: item.ChildCount })
                : t('not_available');
        default:
            return '';
    }
}

const ItemsRow = ({ title, items, detailFields, useThumbImage }: ItemsRowProps) => {
    const { t } = useTranslation('home');
    const { data: recentItems, isLoading } = useRowItems(items);

    useEffect(() => {
        if (recentItems && recentItems.length === 0) {
            console.warn(`ItemsRow: No items found for section "${title}"`);
        }
    }, [recentItems, title]);

    return (
        ((recentItems && recentItems.length > 0) || isLoading) && (
            <ScrollableHomeSection title={title || t('items')} focusable={!!recentItems}>
                {recentItems
                    ? recentItems.map((item) => (
                          <ItemCard
                              key={item.Id}
                              item={item}
                              autoFocus={false}
                              useThumb={useThumbImage}
                              detail={
                                  detailFields && detailFields.length > 0 ? (
                                      <div className="flex flex-wrap items-center mt-1">
                                          {detailFields.map((field) => (
                                              <span
                                                  key={field}
                                                  className="text-xs text-muted-foreground mr-3"
                                              >
                                                  {getDetailFieldsStringForItem(field, item, t)}
                                              </span>
                                          ))}
                                      </div>
                                  ) : undefined
                              }
                          />
                      ))
                    : Array.from({ length: 5 }).map((_, index) => (
                          <div key={index} className="w-40">
                              <Skeleton className="w-40 h-54 rounded-md mb-2" />
                              <Skeleton className="w-36 h-4 mb-1" />
                              <Skeleton className="w-24 h-3" />
                          </div>
                      ))}
            </ScrollableHomeSection>
        )
    );
};

export default ItemsRow;
