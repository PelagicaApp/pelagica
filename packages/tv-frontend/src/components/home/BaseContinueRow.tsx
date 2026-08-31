import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import {
    getBackdropUrl,
    getDetailLineText,
    getPrimaryImageUrl,
    getThumbUrl,
    getTitleLineText,
    type ContinueWatchingDetailLine,
    type ContinueWatchingTitleLine,
} from '@pelagica/core';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FocusableCard from '../FocusableCard';
import { cn } from '@/lib/utils';
import { FOCUS_RING_LARGE } from '@/lib/focus-styles';
import { Dot, ImageOff } from 'lucide-react';
import ScrollableHomeSection from './ScrollableHomeSection';
import { Skeleton } from '../ui/skeleton';
import { buildPlayerUrl } from '@/lib/playerUrl';

interface BaseContinueRowProps {
    items: BaseItemDto[];
    isLoading: boolean;
    error: unknown;
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
}
type ImageState = 'thumb' | 'backdrop' | 'primary' | 'failed';

const ContinueEpisodeCard = memo(function ContinueEpisodeCard({
    item,
    imageState,
    onImageError,
    autoFocus,
    className,
    titleLine,
    detailLine,
}: {
    item: BaseItemDto;
    imageState: ImageState;
    onImageError: (item: BaseItemDto) => void;
    autoFocus?: boolean;
    className?: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
}) {
    const { t } = useTranslation('home');
    const watched = item.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = item.RunTimeTicks ?? 0;
    const progress = runtime > 0 ? (watched / runtime) * 100 : 0;

    const imageSrc =
        imageState === 'thumb'
            ? getThumbUrl(item.Id!, { width: 416 }, item.ImageTags?.Thumb)
            : imageState === 'backdrop'
              ? getBackdropUrl(item.Id!, { width: 416 }, item.BackdropImageTags?.[0])
              : imageState === 'primary'
                ? getPrimaryImageUrl(item.Id!, { width: 416 }, item.ImageTags?.Primary)
                : '';

    return (
        <FocusableCard
            to={buildPlayerUrl(item.Id!)}
            autoFocus={autoFocus}
            className={cn('w-46', className)}
        >
            {(focused) => (
                <>
                    <div
                        className={cn(
                            'relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted',
                            focused && FOCUS_RING_LARGE
                        )}
                    >
                        {imageState === 'failed' || !item.Id ? (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : (
                            <img
                                src={imageSrc}
                                alt={item.Name || t('continue_item_alt')}
                                className="h-full w-full object-cover"
                                onError={() => onImageError(item)}
                            />
                        )}
                        {progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-gray-700">
                                <div
                                    style={{ width: `${progress}%` }}
                                    className="h-full bg-brand transition-width"
                                />
                            </div>
                        )}
                    </div>
                    <p className="mt-2 text-sm font-medium line-clamp-1 text-ellipsis break-all">
                        {getTitleLineText(item, titleLine, t)}
                    </p>
                    <div className="flex items-center space-x-0 text-xs text-muted-foreground overflow-hidden">
                        {detailLine && detailLine.length > 0
                            ? detailLine.map((line, idx) => {
                                  const detailText = getDetailLineText(item, line, t);
                                  if (!detailText) return null;

                                  const isLast = idx === detailLine.length - 1;

                                  return (
                                      <span
                                          key={`${item.Id}-${line}`}
                                          className={`flex items-center ${
                                              isLast ? 'min-w-0 flex-1' : 'whitespace-nowrap'
                                          }`}
                                      >
                                          <span
                                              className={`${
                                                  isLast ? 'truncate' : 'whitespace-nowrap'
                                              }`}
                                          >
                                              {detailText}
                                          </span>
                                          {!isLast && (
                                              <Dot className="w-5 text-muted-foreground shrink-0" />
                                          )}
                                      </span>
                                  );
                              })
                            : null}
                    </div>
                </>
            )}
        </FocusableCard>
    );
});

const BaseContinueRow = ({
    items,
    isLoading,
    error,
    title,
    titleLine,
    detailLine,
}: BaseContinueRowProps) => {
    const { t } = useTranslation('home');
    const [imageStates, setImageStates] = useState<Record<string, ImageState>>({});

    const handleImageError = useCallback((item: BaseItemDto) => {
        const id = item.Id;
        if (!id) return;

        setImageStates((prev) => {
            const state = prev[id] ?? 'thumb';
            let next: ImageState = 'failed';

            if (state === 'thumb' && item.BackdropImageTags?.length) {
                next = 'backdrop';
            } else if ((state === 'thumb' || state === 'backdrop') && item.ImageTags?.Primary) {
                next = 'primary';
            }

            return { ...prev, [id]: next };
        });
    }, []);

    return (
        <>
            {error && (
                <div className="text-destructive">
                    {t('error_loading_continue', { error: String(error) })}
                </div>
            )}
            {((items && items.length > 0) || isLoading) && (
                <ScrollableHomeSection title={title} focusable={!isLoading}>
                    {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="flex flex-col">
                                  <Skeleton className="aspect-video w-46" />
                                  <Skeleton className="mt-2 h-4 w-32" />
                                  <Skeleton className="mt-2 h-3 w-24" />
                              </div>
                          ))
                        : items.map((item) => (
                              <ContinueEpisodeCard
                                  key={item.Id}
                                  item={item}
                                  imageState={imageStates[item.Id!] ?? 'thumb'}
                                  onImageError={handleImageError}
                                  titleLine={titleLine}
                                  detailLine={detailLine}
                              />
                          ))}
                </ScrollableHomeSection>
            )}
        </>
    );
};

export default BaseContinueRow;
