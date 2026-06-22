import FavoriteButton from '@/components/FavoriteButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import WatchListButton from '@/components/WatchlistButton';
import type { SectionItemsConfig } from '@/hooks/api/useConfig';
import { useMediaBarItems } from '@/hooks/api/useMediaBarItems';
import { getBackdropUrl, getLogoUrl } from '@/utils/jellyfinUrls';
import { getEndsAt, ticksToReadableTime } from '@/utils/timeConversion';
import { Play, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

interface MediaBarProps {
    className?: string;
    title?: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    itemsConfig?: SectionItemsConfig;
    showFavoriteButton?: boolean;
    showWatchlistButton?: boolean;
    fadeTop?: boolean;
}

const MediaBar = ({
    className,
    size = 'medium',
    itemsConfig,
    title,
    showFavoriteButton,
    showWatchlistButton,
    fadeTop,
}: MediaBarProps) => {
    const { t } = useTranslation('home');
    const { data: mediabarItems, isLoading, isError } = useMediaBarItems(itemsConfig);
    const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());
    const [api, setApi] = useState<CarouselApi>();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (!api) return;
        const onSelect = () => setActiveIndex(api.selectedScrollSnap());
        api.on('select', onSelect);
        return () => {
            api.off('select', onSelect);
        };
    }, [api]);

    const handleLogoError = (itemId: string) => {
        setLogoErrors((prev) => new Set([...prev, itemId]));
    };

    const outerSize =
        size === 'small'
            ? 'min-h-60 sm:min-h-80'
            : size === 'large'
              ? 'min-h-80 sm:min-h-130 lg:min-h-180'
              : size === 'xlarge'
                ? 'min-h-[82vh] sm:min-h-[82vh] lg:min-h-[82vh]'
                : 'min-h-100 sm:min-h-130';

    const logoSize =
        size === 'small'
            ? 'max-h-15'
            : size === 'large'
              ? 'max-h-40 sm:max-h-60'
              : size === 'xlarge'
                ? 'max-h-48 sm:max-h-72'
                : 'max-h-30 sm:max-h-50';

    return (
        <div className={`${className} relative`}>
            {title && <h2 className="text-2xl font-bold mb-3 pl-12 pt-4">{title}</h2>}

            <div
                className="absolute inset-x-0 top-0 -z-10 pointer-events-none"
                style={{ height: 'calc(100% + 10rem)' }}
            >
                {mediabarItems?.map((item, i) => (
                    <div
                        key={item.Id}
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                        style={{
                            backgroundImage: `url('${getBackdropUrl(item.Id!, { maxWidth: 2560 }, item.ImageTags?.Backdrop)}')`,
                            opacity: i === activeIndex ? 1 : 0,
                        }}
                    />
                ))}

                {/* Side vignette */}
                <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/70 to-transparent max-w-5xl" />

                {/* Top fade */}
                {fadeTop && (
                    <div className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-background to-transparent" />
                )}

                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-b from-transparent to-background" />
            </div>

            <Carousel setApi={setApi} opts={{ loop: true }}>
                <CarouselContent>
                    {isLoading && (
                        <CarouselItem>
                            <div
                                className={`flex flex-col items-start justify-end gap-4 relative ${outerSize}`}
                            >
                                <div className="flex flex-col items-start gap-4 max-w-2xl px-6 sm:px-8 py-6 rounded relative z-10 w-full">
                                    <Skeleton className={`${logoSize} w-full`} />
                                    <div className="flex flex-wrap gap-2 w-full">
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-24" />
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm w-full">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-10 w-32 rounded-md" />
                                </div>
                            </div>
                        </CarouselItem>
                    )}
                    {mediabarItems &&
                        mediabarItems.map((item) => (
                            <CarouselItem key={item.Id}>
                                <div
                                    className={`flex flex-col items-start justify-end gap-4 relative ${outerSize}`}
                                >
                                    <div className="flex flex-col items-start gap-4 max-w-2xl px-6 sm:px-12 py-6 relative z-10">
                                        {getLogoUrl(item.Id!) && !logoErrors.has(item.Id!) ? (
                                            <img
                                                src={getLogoUrl(
                                                    item.Id!,
                                                    { maxHeight: 400 },
                                                    item.ImageTags?.Logo
                                                )}
                                                alt={item.Name || 'Item Logo'}
                                                className={`${logoSize} h-full object-contain`}
                                                onError={() => handleLogoError(item.Id!)}
                                            />
                                        ) : (
                                            <h2 className="text-2xl sm:text-4xl font-bold">
                                                {item.Name}
                                            </h2>
                                        )}
                                        {item.GenreItems && item.GenreItems.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {item.GenreItems.map((genre) => (
                                                    <Badge
                                                        variant={'outline'}
                                                        key={genre.Id}
                                                        data-id={genre.Id}
                                                        className="text-white"
                                                    >
                                                        {genre.Name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                            {item.PremiereDate && (
                                                <span>
                                                    {new Date(item.PremiereDate).getFullYear()}
                                                </span>
                                            )}
                                            {item.Type === 'Series' && item.ChildCount && (
                                                <span>
                                                    {item.ChildCount === 1
                                                        ? t('season_count', {
                                                              count: item.ChildCount,
                                                          })
                                                        : t('season_count_plural', {
                                                              count: item.ChildCount,
                                                          })}
                                                </span>
                                            )}
                                            {item.Type === 'Series' && item.RecursiveItemCount && (
                                                <span>
                                                    {item.RecursiveItemCount === 1
                                                        ? t('episode_count', {
                                                              count: item.RecursiveItemCount,
                                                          })
                                                        : t('episode_count_plural', {
                                                              count: item.RecursiveItemCount,
                                                          })}
                                                </span>
                                            )}
                                            {item.Type !== 'Series' &&
                                                item.RunTimeTicks &&
                                                item.RunTimeTicks > 0 && (
                                                    <>
                                                        <span>
                                                            {ticksToReadableTime(item.RunTimeTicks)}
                                                        </span>
                                                        <span>
                                                            {t('ends_at', {
                                                                date: getEndsAt(
                                                                    item.RunTimeTicks!
                                                                ).toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                }),
                                                            })}
                                                        </span>
                                                    </>
                                                )}
                                            {item.CommunityRating && (
                                                <div className="flex items-center gap-1">
                                                    <Star size={14} />
                                                    <span>{item.CommunityRating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm line-clamp-2 text-gray-300">
                                            {item.Overview}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="default" size="lg" asChild>
                                                <Link to={`/item/${item.Id}`}>
                                                    <Play />
                                                    {t('play')}
                                                </Link>
                                            </Button>
                                            {showFavoriteButton !== false && (
                                                <FavoriteButton
                                                    item={item}
                                                    size={'icon-lg'}
                                                    variant={'outline'}
                                                />
                                            )}
                                            {showWatchlistButton !== false && (
                                                <WatchListButton
                                                    item={item}
                                                    size={'icon-lg'}
                                                    variant={'outline'}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                </CarouselContent>
                {!isError && (
                    <>
                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                    </>
                )}
            </Carousel>
        </div>
    );
};

export default MediaBar;
