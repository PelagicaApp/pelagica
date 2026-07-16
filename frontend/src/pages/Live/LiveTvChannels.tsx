import { useTranslation } from 'react-i18next';
import {
    useLiveTvChannels,
    type UseLiveTvChannelsOptions,
} from '../../hooks/api/useLiveTvChannels';
import { useMemo } from 'react';
import { getPrimaryImageUrl, type ImageSize } from '../../utils/jellyfinUrls';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '../../components/ui/empty';
import { SearchIcon, TriangleAlert, Tv } from 'lucide-react';
import LibraryItem from '../Library/LibraryItem';

const CHANNEL_POSTER_SIZE: ImageSize = { maxWidth: 500, maxHeight: 281 };
const GRID_COLS = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getProgramTimeRange(
    startDate?: string | null,
    endDate?: string | null
): string | undefined {
    if (!startDate || !endDate) return undefined;
    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}

interface LiveTvChannelsProps {
    searchTerm: string;
    categoryOptions: Partial<UseLiveTvChannelsOptions>;
}

const LiveTvChannels = ({ searchTerm, categoryOptions }: LiveTvChannelsProps) => {
    const { t } = useTranslation(['live', 'common']);
    const { data, isLoading, isError } = useLiveTvChannels(categoryOptions);

    const filteredItems = useMemo(() => {
        if (!data) return [];
        const query = searchTerm.trim().toLowerCase();
        if (!query) return data.items;
        return data.items.filter((item) => item.Name?.toLowerCase().includes(query));
    }, [data, searchTerm]);

    const posterUrls = useMemo(() => {
        if (!data) return {};
        return data.items.reduce(
            (acc, item) => {
                acc[item.Id!] = getPrimaryImageUrl(
                    item.Id!,
                    CHANNEL_POSTER_SIZE,
                    item.ImageTags?.Primary
                );
                return acc;
            },
            {} as Record<string, string>
        );
    }, [data]);

    return (
        <>
            {isLoading && (
                <div className={`w-full gap-4 mt-2 grid ${GRID_COLS}`}>
                    {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="p-0 m-0">
                            <div className="relative w-full aspect-video overflow-hidden rounded-md">
                                <Skeleton className="w-full h-full" />
                            </div>
                            <Skeleton className="mt-2 h-4 w-3/4" />
                            <Skeleton className="mt-1 h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && isError && (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <TriangleAlert />
                        </EmptyMedia>
                        <EmptyTitle>{t('live:channels_error_title')}</EmptyTitle>
                        <EmptyDescription>{t('live:channels_error_description')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}
            {!isLoading && !isError && data && data.items.length === 0 && (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Tv />
                        </EmptyMedia>
                        <EmptyTitle>{t('live:no_channels_title')}</EmptyTitle>
                        <EmptyDescription>{t('live:no_channels_description')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}
            {!isLoading &&
                !isError &&
                data &&
                data.items.length > 0 &&
                filteredItems.length === 0 && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <SearchIcon />
                            </EmptyMedia>
                            <EmptyTitle>{t('live:no_results_title')}</EmptyTitle>
                            <EmptyDescription>{t('live:no_results_description')}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            {!isLoading && !isError && filteredItems.length > 0 && (
                <div className={`w-full gap-4 mt-2 grid ${GRID_COLS}`}>
                    {filteredItems.map((item) => {
                        const timeRange = getProgramTimeRange(
                            item.CurrentProgram?.StartDate,
                            item.CurrentProgram?.EndDate
                        );
                        return (
                            <LibraryItem
                                key={item.Id}
                                item={item}
                                posterUrl={posterUrls[item.Id!]}
                                t={t}
                                posterAspectRatio="video"
                                posterFit="contain"
                                detailLine={
                                    item.CurrentProgram?.Name && (
                                        <span className="flex flex-col">
                                            <span className="line-clamp-1">
                                                {item.CurrentProgram.Name}
                                            </span>
                                            {timeRange && (
                                                <span className="line-clamp-1">{timeRange}</span>
                                            )}
                                        </span>
                                    )
                                }
                                isDirectPlay
                            />
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default LiveTvChannels;
