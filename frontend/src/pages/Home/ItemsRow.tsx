import SectionScroller from '@/components/SectionScroller';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DetailField, SectionItemsConfig } from '@/hooks/api/useConfig';
import { useRowItems } from '@/hooks/api/useRowItems';
import { Link } from 'react-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getEndsAt, ticksToReadableTime } from '@/utils/timeConversion';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import ScrollableSectionPoster from '@/components/ScrollableSectionPoster';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';

interface ItemsRowProps {
    title?: string;
    allLink?: string;
    items?: SectionItemsConfig;
    detailFields?: DetailField[];
}

function getDetailFieldsStringForItem(
    detailField: DetailField,
    item: BaseItemDto,
    t: TFunction
): ReactNode {
    switch (detailField) {
        case 'ReleaseYear':
            return item.PremiereDate
                ? new Date(item.PremiereDate).getFullYear().toString()
                : t('release_year_unknown');
        case 'ReleaseYearAndMonth':
            return item.PremiereDate
                ? new Date(item.PremiereDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                  })
                : t('release_date_unknown');
        case 'ReleaseDate':
            return item.PremiereDate
                ? new Date(item.PremiereDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : t('release_date_unknown');
        case 'CommunityRating':
            return item.CommunityRating ? (
                <div className="flex items-center gap-1">
                    <Star size={14} />
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

const ItemsRow = ({ title, allLink, items, detailFields }: ItemsRowProps) => {
    const { t } = useTranslation('home');
    const { data: recentItems, isLoading } = useRowItems(items);

    const posterUrls = useMemo(() => {
        if (!recentItems) return {};
        return recentItems.reduce(
            (acc, item) => {
                acc[item.Id!] = getPrimaryImageUrl(
                    item.Id!,
                    {
                        maxWidth: 416,
                        maxHeight: 640,
                    },
                    item.ImageTags?.Primary
                );
                return acc;
            },
            {} as Record<string, string>
        );
    }, [recentItems]);

    useEffect(() => {
        if (recentItems && recentItems.length === 0) {
            console.warn(`ItemsRow: No items found for section "${title}"`);
        }
    }, [recentItems, title]);

    return (
        ((recentItems && recentItems.length > 0) || isLoading) && (
            <SectionScroller
                className="max-w-full"
                title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
                additionalButtons={
                    <>
                        {allLink && (
                            <Button variant={'outline'} asChild>
                                <Link to={allLink}>{t('view_all')}</Link>
                            </Button>
                        )}
                    </>
                }
                items={
                    recentItems
                        ? recentItems.map((item) => (
                              <ScrollableSectionPoster
                                  key={item.Id}
                                  item={item}
                                  posterUrl={posterUrls[item.Id!]}
                              >
                                  <div className="flex flex-wrap items-center mt-1">
                                      {detailFields && detailFields.length > 0
                                          ? detailFields.map((field) => (
                                                <span
                                                    key={field}
                                                    className="text-xs text-muted-foreground mr-3"
                                                >
                                                    {getDetailFieldsStringForItem(field, item, t)}
                                                </span>
                                            ))
                                          : null}
                                  </div>
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

export default ItemsRow;
