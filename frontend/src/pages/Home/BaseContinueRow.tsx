import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@/hooks/api/useConfig';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { getDetailLineText, getTitleLineText } from './continueWatchingLines';
import { buildPlayerUrl } from '@/utils/playerUrl';
import { Dot, ImageOff, Play } from 'lucide-react';
import { getPrimaryImageUrl, getThumbUrl, getBackdropUrl } from '@/utils/jellyfinUrls';
import { Skeleton } from '@/components/ui/skeleton';
import SectionScroller from '@/components/SectionScroller';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import GeneralItemContextMenu from '../../components/GeneraItemContextMenu';

interface BaseContinueRowProps {
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    items: BaseItemDto[];
    isLoading: boolean;
    error: unknown;
}
type ImageState = 'thumb' | 'backdrop' | 'primary' | 'failed';

export function BaseContinueRow({
    title,
    titleLine,
    detailLine,
    items,
    isLoading,
    error,
}: BaseContinueRowProps) {
    const { t } = useTranslation('home');
    const navigate = useNavigate();
    const location = useLocation();

    const [imageStates, setImageStates] = useState<Record<string, ImageState>>({});

    const handleImageError = (item: BaseItemDto) => {
        const id = item.Id;
        if (!id) return;

        const state = imageStates[id] ?? 'thumb';

        switch (state) {
            case 'thumb':
                if (item.BackdropImageTags?.length) {
                    setImageStates((prev) => ({
                        ...prev,
                        [id]: 'backdrop',
                    }));
                    return;
                }

                if (item.ImageTags?.Primary) {
                    setImageStates((prev) => ({
                        ...prev,
                        [id]: 'primary',
                    }));
                    return;
                }
                break;

            case 'backdrop':
                if (item.ImageTags?.Primary) {
                    setImageStates((prev) => ({
                        ...prev,
                        [id]: 'primary',
                    }));
                    return;
                }
                break;
        }

        setImageStates((prev) => ({
            ...prev,
            [id]: 'failed',
        }));
    };

    return (
        <>
            {error && <p>Error loading next up items: {String(error)}</p>}
            {((items && items.length > 0) || isLoading) && (
                <SectionScroller
                    title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
                    items={
                        isLoading || !items
                            ? Array.from({ length: 5 }).map((_, index) => (
                                  <div
                                      key={index}
                                      className="group min-w-48 lg:min-w-64 2xl:min-w-80"
                                  >
                                      <Skeleton className="w-full aspect-video rounded-md mb-2" />
                                      <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-2" />
                                      <Skeleton className="w-40 lg:w-52 2xl:w-64 h-3" />
                                  </div>
                              ))
                            : items.map((item) => {
                                  const watched = item.UserData?.PlaybackPositionTicks ?? 0;
                                  const runtime = item.RunTimeTicks ?? 0;
                                  const progress = runtime > 0 ? (watched / runtime) * 100 : 0;

                                  const currentState =
                                      imageStates[item.Id!] ??
                                      (item.ImageTags?.Thumb
                                          ? 'thumb'
                                          : item.BackdropImageTags?.length
                                            ? 'backdrop'
                                              : item.ImageTags?.Primary
                                              ? 'primary'
                                            : 'failed');

                                  const imageSrc =
                                      currentState === 'thumb'
                                          ? getThumbUrl(
                                                item.Id!,
                                                { width: 416 },
                                                item.ImageTags?.Thumb
                                            )
                                          : currentState === 'backdrop'
                                            ? getBackdropUrl(
                                                  item.Id!,
                                                  { width: 416 },
                                                  item.BackdropImageTags?.[0]
                                              )
                                            : currentState === 'primary'
                                              ? getPrimaryImageUrl(
                                                    item.Id!,
                                                    { width: 416 },
                                                    item.ImageTags?.Primary
                                                )
                                              : '';

                                  return (
                                      <GeneralItemContextMenu
                                          key={item.Id}
                                          item={item}
                                          playLink={buildPlayerUrl(
                                              item.Id!,
                                              location.pathname + location.search
                                          )}
                                      >
                                          <Link
                                              to={`/item/${item.Id}`}
                                              className="group w-min min-w-48 lg:min-w-64 2xl:min-w-80"
                                          >
                                              <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                                  {currentState === 'failed' ? (
                                                      <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                                                          <ImageOff className="w-12 h-12 text-muted-foreground" />
                                                      </div>
                                                  ) : (
                                                      <img
                                                          src={imageSrc}
                                                          alt={item.Name || t('no_title')}
                                                          className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                                                          onError={() => handleImageError(item)}
                                                      />
                                                  )}
                                                  {progress > 0 && (
                                                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                                          <div
                                                              style={{ width: `${progress}%` }}
                                                              className="h-full bg-brand transition-width"
                                                          />
                                                      </div>
                                                  )}
                                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <div
                                                          className="bg-black/60 rounded-full p-4 cursor-pointer hover:bg-black/75"
                                                          role="button"
                                                          onClick={(e) => {
                                                              e.preventDefault();
                                                              navigate(
                                                                  buildPlayerUrl(
                                                                      item.Id!,
                                                                      location.pathname +
                                                                          location.search
                                                                  )
                                                              );
                                                          }}
                                                      >
                                                          <Play className="w-6 h-6 text-white fill-white" />
                                                      </div>
                                                  </div>
                                                  <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                                              </div>
                                              <p className="mt-2 text-sm line-clamp-1 text-ellipsis break-all">
                                                  {getTitleLineText(item, titleLine, t)}
                                              </p>
                                              <div className="flex items-center space-x-0 text-xs text-muted-foreground overflow-hidden">
                                                  {detailLine && detailLine.length > 0
                                                      ? detailLine.map((line, idx) => {
                                                            const detailText = getDetailLineText(
                                                                item,
                                                                line,
                                                                t
                                                            );
                                                            if (!detailText) return null;

                                                            const isLast =
                                                                idx === detailLine.length - 1;

                                                            return (
                                                                <span
                                                                    key={`${item.Id}-${line}`}
                                                                    className={`flex items-center ${
                                                                        isLast
                                                                            ? 'min-w-0 flex-1'
                                                                            : 'whitespace-nowrap'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`${
                                                                            isLast
                                                                                ? 'truncate'
                                                                                : 'whitespace-nowrap'
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
                                          </Link>
                                      </GeneralItemContextMenu>
                                  );
                              })
                    }
                    contentInset={true}
                />
            )}
        </>
    );
}

export default BaseContinueRow;
