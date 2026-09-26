import { useCallback, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useLayerFocusable as useFocusable } from '@/router/useLayerFocusable';
import {
    getBackdropUrl,
    getLogoUrl,
    useMediaBarItems,
    type MediabarSize,
    type SectionItemsConfig,
} from '@pelagica/core';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ChevronRight, PlayIcon, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRuntime } from '@/lib/formatRuntime';
import WatchlistButton from '../WatchlistButton';
import FavoriteButton from '../FavoriteButton';
import FocusableButton from '../FocusableButton';
import { useNavigate } from '@/router';
import { getItemLink } from '../../lib/getItemLink';

const HEIGHT_CLASSES: Record<MediabarSize, string> = {
    small: 'h-[42vh] min-h-72',
    medium: 'h-[52vh] min-h-84',
    large: 'h-[64vh] min-h-100',
    xlarge: 'h-[82vh] min-h-116',
};

interface MediaBarRowProps {
    title?: string;
    size?: MediabarSize;
    itemsConfig?: SectionItemsConfig;
    showFavoriteButton?: boolean;
    showWatchlistButton?: boolean;
    bleedTop?: boolean;
}

const MediaBarButtonRow = ({
    children,
    onFocusChange,
}: PropsWithChildren<{ onFocusChange: (hasFocus: boolean) => void }>) => {
    const { ref, focusKey, hasFocusedChild } = useFocusable<object, HTMLDivElement>({
        saveLastFocusedChild: true,
        trackChildren: true,
    });

    useEffect(() => {
        onFocusChange(hasFocusedChild);
    }, [hasFocusedChild, onFocusChange]);

    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className="mt-1 flex flex-wrap gap-3">
                {children}
            </div>
        </FocusContext.Provider>
    );
};

const MediaBarRow = ({
    title,
    size = 'large',
    itemsConfig,
    showFavoriteButton = true,
    showWatchlistButton = true,
    bleedTop = false,
}: MediaBarRowProps) => {
    const { t } = useTranslation('home');
    const { data: items, isLoading } = useMediaBarItems(itemsConfig);
    const [activeIndex, setActiveIndex] = useState(0);
    const [backdropError, setBackdropError] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    const activeItem = items?.[activeIndex];

    const handleButtonRowFocusChange = useCallback((hasFocus: boolean) => {
        if (hasFocus) {
            containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleNext = useCallback(() => {
        if (!items || items.length < 2) return;
        setActiveIndex((prev) => (prev + 1) % items.length);
    }, [items]);

    useEffect(() => {
        setBackdropError(false);
        setLogoError(false);
    }, [activeItem?.Id]);

    if (!isLoading && (!items || items.length === 0)) {
        return null;
    }

    return (
        <section className="min-w-0 w-full flex flex-col gap-3">
            {title && !bleedTop && <h2 className="text-lg font-semibold">{title}</h2>}
            <div
                ref={containerRef}
                className={cn(
                    'relative overflow-hidden bg-muted',
                    bleedTop ? '-mx-6 -mt-20' : 'w-full rounded-xl',
                    HEIGHT_CLASSES[size]
                )}
            >
                <div className="absolute inset-0">
                    {activeItem?.Id && !backdropError && (
                        <img
                            key={activeItem.Id}
                            src={getBackdropUrl(
                                activeItem.Id,
                                { maxWidth: 1920 },
                                activeItem.ImageTags?.Backdrop
                            )}
                            alt=""
                            decoding="async"
                            className="h-full w-full object-cover animate-in fade-in duration-700"
                            onError={() => setBackdropError(true)}
                        />
                    )}
                    {/* Side vignette so the text stays legible over the backdrop */}
                    <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/50 to-transparent" />
                    {/* Fades the hero into the page background at the bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-b from-transparent to-background" />
                    {!bleedTop && (
                        <div className="absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-background to-transparent" />
                    )}
                </div>

                <div className="relative z-10 flex h-full flex-col justify-end gap-3 py-6 pr-6 pl-9">
                    {!activeItem ? (
                        <div className="flex max-w-2xl flex-col gap-3">
                            <Skeleton className="h-14 w-2/3" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-14 rounded-full" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-10 w-32 rounded-md" />
                        </div>
                    ) : (
                        <div className="flex max-w-2xl flex-col gap-3">
                            <div
                                key={activeItem.Id}
                                className="flex flex-col gap-3 animate-in fade-in duration-500"
                            >
                                {!logoError && activeItem.Id ? (
                                    <img
                                        src={getLogoUrl(
                                            activeItem.Id,
                                            { maxHeight: 200 },
                                            activeItem.ImageTags?.Logo
                                        )}
                                        alt={activeItem.Name || ''}
                                        decoding="async"
                                        className="h-16 max-w-full object-contain object-left"
                                        onError={() => setLogoError(true)}
                                    />
                                ) : (
                                    <h2 className="text-3xl font-semibold tracking-tight text-balance">
                                        {activeItem.Name}
                                    </h2>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {activeItem.PremiereDate && (
                                        <Badge variant="outline">
                                            {new Date(activeItem.PremiereDate).getFullYear()}
                                        </Badge>
                                    )}
                                    {activeItem.CommunityRating && (
                                        <Badge variant="outline">
                                            <Star /> {activeItem.CommunityRating.toFixed(1)}
                                        </Badge>
                                    )}
                                    {activeItem.Type === 'Series' && activeItem.ChildCount ? (
                                        <Badge variant="outline">
                                            {t('season_count', { count: activeItem.ChildCount })}
                                        </Badge>
                                    ) : (
                                        activeItem.RunTimeTicks && (
                                            <Badge variant="outline">
                                                {formatRuntime(activeItem.RunTimeTicks)}
                                            </Badge>
                                        )
                                    )}
                                </div>

                                {activeItem.GenreItems && activeItem.GenreItems.length > 0 && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {activeItem.GenreItems.map((genre) => genre.Name).join(
                                            ', '
                                        )}
                                    </p>
                                )}

                                {activeItem.Overview && (
                                    <p className="text-sm text-foreground/90 line-clamp-2">
                                        {activeItem.Overview}
                                    </p>
                                )}
                            </div>

                            <MediaBarButtonRow onFocusChange={handleButtonRowFocusChange}>
                                <FocusableButton
                                    onClick={() =>
                                        navigate(getItemLink(activeItem.Type, activeItem.Id))
                                    }
                                    size="lg"
                                >
                                    <PlayIcon />
                                    {t('play')}
                                </FocusableButton>
                                {showWatchlistButton && <WatchlistButton item={activeItem} />}
                                {showFavoriteButton && <FavoriteButton item={activeItem} />}
                                {items && items.length > 1 && (
                                    <FocusableButton
                                        variant="outline"
                                        size="lg"
                                        onClick={handleNext}
                                        aria-label={t('next')}
                                    >
                                        <ChevronRight />
                                    </FocusableButton>
                                )}
                            </MediaBarButtonRow>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MediaBarRow;
