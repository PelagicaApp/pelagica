import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Link, useNavigate } from 'react-router';
import { SearchIcon, TriangleAlert, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLiveTvChannels, type UseLiveTvChannelsOptions } from '@/hooks/api/useLiveTvChannels';
import { useLiveTvPrograms } from '@/hooks/api/useLiveTvPrograms';
import { getPrimaryImageUrl, type ImageSize } from '@/utils/jellyfinUrls';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { cn } from '@/lib/utils';

const CHANNEL_COL_WIDTH = 180;
const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 32;
const PX_PER_MINUTE = 5;
const LOOKBACK_MINUTES = 60;
const FORWARD_HOURS = 24;
const GUIDE_WINDOW_MINUTES = LOOKBACK_MINUTES + FORWARD_HOURS * 60;
const GUIDE_WIDTH = GUIDE_WINDOW_MINUTES * PX_PER_MINUTE;
const CHANNEL_LOGO_SIZE: ImageSize = { maxWidth: 80, maxHeight: 45 };
const NOW_SCROLL_LEFT_PADDING = 80;

function roundDownToHalfHour(date: Date): Date {
    const d = new Date(date);
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() < 30 ? 0 : 30);
    return d;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRange(startDate?: string | null, endDate?: string | null): string {
    if (!startDate || !endDate) return '';
    return `${formatTime(new Date(startDate))} - ${formatTime(new Date(endDate))}`;
}

interface ProgramSegment {
    program: BaseItemDto;
    left: number;
    width: number;
}

interface GuideGap {
    left: number;
    width: number;
}

function getGaps(segments: ProgramSegment[], guideWidth: number): GuideGap[] {
    const gaps: GuideGap[] = [];
    let cursor = 0;
    for (const segment of segments) {
        if (segment.left > cursor) gaps.push({ left: cursor, width: segment.left - cursor });
        cursor = Math.max(cursor, segment.left + segment.width);
    }
    if (cursor < guideWidth) gaps.push({ left: cursor, width: guideWidth - cursor });
    return gaps;
}

function formatEpisodeInfo(program: BaseItemDto, t: TFunction): string | undefined {
    const season = program.ParentIndexNumber;
    const episode = program.IndexNumber;
    const title = program.EpisodeTitle;
    if (season == null && episode == null && !title) return undefined;
    return [
        season != null ? t('live:guide_season', { number: season }) : undefined,
        episode != null ? t('live:guide_episode', { number: episode }) : undefined,
        title || undefined,
    ]
        .filter(Boolean)
        .join(' · ');
}

const ChannelLogo = ({
    channelId,
    imageTag,
    alt,
}: {
    channelId: string;
    imageTag?: string | undefined;
    alt: string;
}) => {
    const [error, setError] = useState(false);

    if (error) {
        return (
            <div className="w-10 h-5.5 shrink-0 flex items-center justify-center rounded bg-muted">
                <Tv className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
        );
    }

    return (
        <img
            src={getPrimaryImageUrl(channelId, CHANNEL_LOGO_SIZE, imageTag)}
            alt={alt}
            className="w-10 h-5.5 object-contain shrink-0"
            loading="lazy"
            onError={() => setError(true)}
        />
    );
};

interface LiveTvGuideProps {
    searchTerm: string;
    categoryOptions: Partial<UseLiveTvChannelsOptions>;
}

const LiveTvGuide = ({ searchTerm, categoryOptions }: LiveTvGuideProps) => {
    const { t } = useTranslation(['live', 'common']);
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [guideStart] = useState(() =>
        roundDownToHalfHour(new Date(Date.now() - LOOKBACK_MINUTES * 60000))
    );
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const guideEnd = useMemo(
        () => new Date(guideStart.getTime() + GUIDE_WINDOW_MINUTES * 60000),
        [guideStart]
    );

    const {
        data: channelsData,
        isLoading: isLoadingChannels,
        isError: isChannelsError,
    } = useLiveTvChannels({
        limit: 200,
        ...categoryOptions,
    });
    const allChannels = useMemo(() => channelsData?.items ?? [], [channelsData]);
    const channels = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return allChannels;
        return allChannels.filter((channel) => channel.Name?.toLowerCase().includes(query));
    }, [allChannels, searchTerm]);
    const channelIds = useMemo(
        () => channels.map((c) => c.Id).filter((id): id is string => Boolean(id)),
        [channels]
    );

    const { data: programs, isLoading: isLoadingPrograms } = useLiveTvPrograms({
        channelIds,
        startDate: guideStart,
        endDate: guideEnd,
    });

    const programsByChannel = useMemo(() => {
        const map = new Map<string, BaseItemDto[]>();
        for (const program of programs ?? []) {
            if (!program.ChannelId || !program.StartDate || !program.EndDate) continue;
            const list = map.get(program.ChannelId) ?? [];
            list.push(program);
            map.set(program.ChannelId, list);
        }
        return map;
    }, [programs]);

    const timeSlots = useMemo(() => {
        const slots: Date[] = [];
        for (let i = 0; i < GUIDE_WINDOW_MINUTES; i += 30) {
            slots.push(new Date(guideStart.getTime() + i * 60000));
        }
        return slots;
    }, [guideStart]);

    const nowOffsetPx = ((now - guideStart.getTime()) / 60000) * PX_PER_MINUTE;
    const showNowLine = now >= guideStart.getTime() && now <= guideEnd.getTime();

    const getOffsetPx = useCallback(
        (dateStr: string) =>
            ((new Date(dateStr).getTime() - guideStart.getTime()) / 60000) * PX_PER_MINUTE,
        [guideStart]
    );

    useEffect(() => {
        if (isLoadingChannels) return;
        scrollRef.current?.scrollTo({ left: Math.max(0, nowOffsetPx - NOW_SCROLL_LEFT_PADDING) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingChannels]);

    if (!isLoadingChannels && isChannelsError) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <TriangleAlert />
                    </EmptyMedia>
                    <EmptyTitle>{t('live:channels_error_title')}</EmptyTitle>
                    <EmptyDescription>{t('live:channels_error_description')}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (!isLoadingChannels && allChannels.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Tv />
                    </EmptyMedia>
                    <EmptyTitle>{t('live:no_channels_title')}</EmptyTitle>
                    <EmptyDescription>{t('live:no_channels_description')}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (!isLoadingChannels && channels.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <SearchIcon />
                    </EmptyMedia>
                    <EmptyTitle>{t('live:no_results_title')}</EmptyTitle>
                    <EmptyDescription>{t('live:no_results_description')}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-3 mt-2">
            {isLoadingChannels ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : (
                <div ref={scrollRef} className="overflow-x-auto">
                    <div className="relative" style={{ width: CHANNEL_COL_WIDTH + GUIDE_WIDTH }}>
                        <div className="flex sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
                            <div
                                className="sticky left-0 z-40 bg-background shrink-0"
                                style={{ width: CHANNEL_COL_WIDTH, height: HEADER_HEIGHT }}
                            />
                            <div
                                className="relative shrink-0"
                                style={{ width: GUIDE_WIDTH, height: HEADER_HEIGHT }}
                            >
                                {timeSlots.map((slot, i) => (
                                    <div
                                        key={i}
                                        className="absolute bottom-1.5 flex items-center gap-1 text-xs text-muted-foreground"
                                        style={{ left: i * 30 * PX_PER_MINUTE }}
                                    >
                                        <span className="w-px h-2 bg-border" />
                                        {formatTime(slot)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {channels.map((channel) => {
                            const channelPrograms = programsByChannel.get(channel.Id!) ?? [];
                            const segments: ProgramSegment[] = channelPrograms
                                .map((program) => {
                                    const left = Math.max(0, getOffsetPx(program.StartDate!));
                                    const right = Math.min(
                                        GUIDE_WIDTH,
                                        getOffsetPx(program.EndDate!)
                                    );
                                    return { program, left, width: right - left };
                                })
                                .filter((segment) => segment.width > 0)
                                .sort((a, b) => a.left - b.left);
                            const gaps = getGaps(segments, GUIDE_WIDTH);
                            return (
                                <div
                                    key={channel.Id}
                                    className="flex isolate mb-1.5 last:mb-0"
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    <div
                                        className="sticky left-0 z-30 bg-background shrink-0 rounded-l-lg flex items-center gap-2 px-2 cursor-pointer hover:bg-muted transition-colors"
                                        style={{ width: CHANNEL_COL_WIDTH }}
                                        onClick={() => navigate(`/play/${channel.Id}`)}
                                    >
                                        <ChannelLogo
                                            channelId={channel.Id!}
                                            imageTag={channel.ImageTags?.Primary}
                                            alt=""
                                        />
                                        <span className="text-sm line-clamp-2">{channel.Name}</span>
                                    </div>
                                    <div
                                        className="relative shrink-0"
                                        style={{ width: GUIDE_WIDTH }}
                                    >
                                        {showNowLine && (
                                            <div
                                                className="absolute -top-1 -bottom-1 w-px bg-primary z-10 pointer-events-none"
                                                style={{ left: nowOffsetPx }}
                                            />
                                        )}
                                        {gaps.map((gap, i) => (
                                            <div
                                                key={`gap-${i}`}
                                                className="absolute top-1.5 bottom-1.5 flex items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground/70 overflow-hidden"
                                                style={{
                                                    left: gap.left + 2,
                                                    width: Math.max(0, gap.width - 4),
                                                }}
                                            >
                                                {gap.width > 60 && (
                                                    <span className="line-clamp-1 px-1">
                                                        {t('live:guide_no_data')}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {segments.map(({ program, left, width }) => {
                                            const startMs = new Date(program.StartDate!).getTime();
                                            const endMs = new Date(program.EndDate!).getTime();
                                            const isCurrent = startMs <= now && now <= endMs;
                                            const episodeInfo = formatEpisodeInfo(program, t);
                                            return (
                                                <Popover key={program.Id}>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            className={cn(
                                                                'absolute top-1.5 bottom-1.5 rounded-lg px-2 py-1 text-left text-xs overflow-hidden hover:bg-muted transition-colors cursor-pointer',
                                                                isCurrent
                                                                    ? 'bg-primary/10 border border-primary/40'
                                                                    : 'bg-muted/40'
                                                            )}
                                                            style={{
                                                                left: left + 2,
                                                                width: Math.max(0, width - 4),
                                                            }}
                                                        >
                                                            <span className="font-medium line-clamp-1">
                                                                {program.Name}
                                                            </span>
                                                            <span className="text-muted-foreground line-clamp-1">
                                                                {formatRange(
                                                                    program.StartDate,
                                                                    program.EndDate
                                                                )}
                                                            </span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-100 p-0 overflow-hidden">
                                                        <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
                                                            <Skeleton className="absolute inset-0 w-full h-full" />
                                                            <img
                                                                src={getPrimaryImageUrl(
                                                                    program.Id! || '',
                                                                    { maxHeight: 300 },
                                                                    program.ImageTags?.Primary
                                                                )}
                                                                alt={program.Name + ' Primary'}
                                                                className={[
                                                                    'object-cover w-full h-full relative z-10',
                                                                    'transition-[filter,opacity] duration-700 ease-out blur-0 opacity-100',
                                                                ].join(' ')}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2 p-4">
                                                            <p className="font-medium">
                                                                {program.Name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground -mt-1">
                                                                {formatRange(
                                                                    program.StartDate,
                                                                    program.EndDate
                                                                )}
                                                            </p>
                                                            {episodeInfo && (
                                                                <p className="text-sm">
                                                                    {episodeInfo}
                                                                </p>
                                                            )}
                                                            {program.Overview && (
                                                                <p className="text-sm line-clamp-3 text-muted-foreground">
                                                                    {program.Overview}
                                                                </p>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                className="mt-1 w-full"
                                                                asChild
                                                            >
                                                                <Link to={`/play/${channel.Id}`}>
                                                                    {t('live:guide_watch_channel')}
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {isLoadingPrograms && (
                            <div className="absolute inset-0 top-8 bg-background/40 pointer-events-none" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveTvGuide;
