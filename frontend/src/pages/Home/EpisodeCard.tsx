import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@pelagica/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import {
    getDetailLineText,
    getTitleLineText,
} from '../../../../packages/core/src/utils/continueWatchingLines';
import { buildPlayerUrl } from '@/utils/playerUrl';
import { Dot, ImageOff, Play } from 'lucide-react';
import { getContinueWatchingImageUrls } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import GeneralItemContextMenu from '../../components/GeneraItemContextMenu';

interface EpisodeCardProps {
    item: BaseItemDto;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    useSeriesImage?: boolean;
}

export function EpisodeCard({ item, titleLine, detailLine, useSeriesImage }: EpisodeCardProps) {
    const { t } = useTranslation('home');
    const navigate = useNavigate();
    const location = useLocation();

    const [imageIndex, setImageIndex] = useState(0);
    const imageSrc = getContinueWatchingImageUrls(item, useSeriesImage)[imageIndex];

    const handleImageError = () => setImageIndex((index) => index + 1);

    const watched = item.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = item.RunTimeTicks ?? 0;
    const progress = runtime > 0 ? (watched / runtime) * 100 : 0;

    const playLink = buildPlayerUrl(item.Id!, location.pathname + location.search);

    return (
        <GeneralItemContextMenu item={item} playLink={playLink}>
            <Link to={`/item/${item.Id}`} className="group w-min min-w-48 lg:min-w-64 2xl:min-w-80">
                <div className="relative w-full aspect-video rounded-md overflow-hidden">
                    {!imageSrc ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                            <ImageOff className="w-12 h-12 text-muted-foreground" />
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={item.Name || t('no_title')}
                            className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                            onError={handleImageError}
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
                                navigate(playLink);
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
                                      <span className={isLast ? 'truncate' : 'whitespace-nowrap'}>
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
}

export default EpisodeCard;
