import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    ArrowLeft,
    AudioLines,
    SkipForward,
    SkipBack,
    Rewind,
    FastForward,
    Subtitles,
    Dot,
    Check,
} from 'lucide-react';
import { useLayerId, useNavigate } from '@/router';
import { useLayerFocusable } from '@/router/useLayerFocusable';
import { useTranslation } from 'react-i18next';
import { FocusContext, pause, resume, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import type {
    BaseItemDto,
    MediaSegmentDto,
    MediaSegmentType,
} from '@jellyfin/sdk/lib/generated-client/models';
import { Button } from '@/components/ui/button';
import FocusableButton from '@/components/FocusableButton';
import { cn } from '@/lib/utils';
import { FOCUS_RING_COMPACT } from '@/lib/focus-styles';
import { formatPlayTime, ticksToReadableTime, ticksToSeconds } from '@/lib/timeConversion';
import { getLogoUrl, getPrimaryImageUrl, useReportPlaybackProgress } from '@pelagica/core';
import { getNavigationAdapter, type TvPlayer } from '@pelagica/tv-platform';
import {
    removeLastSubtitleLanguage,
    setLastAudioLanguage,
    setLastSubtitleLanguage,
} from '@/lib/localstorageLastlanguage';
import { buildPlayerUrl } from '@/lib/playerUrl';

const SEEK_SECONDS = 10;
const HIDE_CONTROLS_TIMEOUT_MS = 5000;

// Some TV browsers (older Tizen WebKit included) still report the pre-standardization
// key names ('Up'/'Down'/'Left'/'Right') instead of 'ArrowUp' etc.
const NAV_KEY_CODES = new Set([13, 37, 38, 39, 40]); // Enter, Left, Up, Right, Down
const NAV_KEY_NAMES = new Set([
    'Enter',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Up',
    'Down',
    'Left',
    'Right',
]);

function isNavigationKey(event: KeyboardEvent) {
    return NAV_KEY_CODES.has(event.keyCode) || NAV_KEY_NAMES.has(event.key);
}

type MediaKeyAction = 'toggle' | 'play' | 'pause';

const MEDIA_KEY_ACTIONS: Record<string, MediaKeyAction> = {
    MediaPlayPause: 'toggle',
    MediaPlay: 'play',
    MediaPause: 'pause',
};
const MEDIA_KEY_CODES: Record<number, MediaKeyAction> = {
    10252: 'toggle', // MediaPlayPause
    415: 'play', // MediaPlay
    19: 'pause', // MediaPause
};

type TrackMenu = 'audio' | 'subtitle' | null;

export interface PlayerControlsHandle {
    /** Returns true if the press was consumed */
    handleBackKey: () => boolean;
}

interface PlayerControlsProps {
    item: BaseItemDto;
    player: TvPlayer | null;
    audioTrackIndex: number | null;
    onAudioTrackChange: (index: number) => void;
    subtitleTrackIndex: number | null;
    onSubtitleTrackChange: (index: number | null) => void;
    mediaSegments?: MediaSegmentDto[];
    previousItem?: BaseItemDto | null;
    nextItem?: BaseItemDto | null;
}

const PlayerControls = forwardRef<PlayerControlsHandle, PlayerControlsProps>(
    function PlayerControls(
        {
            item,
            player,
            audioTrackIndex,
            onAudioTrackChange,
            subtitleTrackIndex,
            onSubtitleTrackChange,
            mediaSegments,
            previousItem,
            nextItem,
        },
        ref
    ) {
        const { t } = useTranslation(['player', 'common']);
        const [isPlaying, setIsPlaying] = useState(false);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);
        const [bufferedTime, setBufferedTime] = useState(0);
        const [isMuted, setIsMuted] = useState(false);
        const [showControls, setShowControls] = useState(true);
        const [openMenu, setOpenMenu] = useState<TrackMenu>(null);
        const [dismissedNextItemPrompt, setDismissedNextItemPrompt] = useState(false);
        const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        const navigate = useNavigate();
        const playPauseFocusKey = `${useLayerId()}:player-play-pause`;
        const { reportProgress } = useReportPlaybackProgress();
        const [backButtonLogoFailed, setBackButtonLogoFailed] = useState(false);

        const markItemAsCompleted = useCallback(
            (itemId: string | undefined) => {
                if (!itemId) return;
                reportProgress({
                    itemId,
                    positionTicks: item.RunTimeTicks || 0,
                    isPaused: true,
                });
            },
            [item.RunTimeTicks, reportProgress]
        );

        const resetHideTimeout = useCallback(() => {
            resume();
            setShowControls(true);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                pause();
            }, HIDE_CONTROLS_TIMEOUT_MS);
        }, []);

        const closeTrackMenu = useCallback(() => {
            setOpenMenu(null);
            setFocus(playPauseFocusKey);
        }, [playPauseFocusKey]);

        useEffect(() => {
            resetHideTimeout();
            return () => {
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                resume();
            };
        }, [resetHideTimeout]);

        useEffect(() => {
            function handleKeyDown(event: KeyboardEvent) {
                if (!isNavigationKey(event)) return;
                if (!showControls) setFocus(playPauseFocusKey);
                resetHideTimeout();
            }

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [resetHideTimeout, showControls, playPauseFocusKey]);

        useImperativeHandle(
            ref,
            () => ({
                handleBackKey: () => {
                    if (openMenu) {
                        closeTrackMenu();
                        return true;
                    }
                    if (showControls) {
                        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                        setShowControls(false);
                        pause();
                        return true;
                    }
                    return false;
                },
            }),
            [openMenu, closeTrackMenu, showControls]
        );

        useEffect(() => {
            if (!player || player.isDisposed()) return;

            const updatePlayState = () => setIsPlaying(!player.isPaused());
            const updateTime = () => setCurrentTime(player.getCurrentTime());
            const updateDuration = () => setDuration(player.getDuration());
            const updateMuted = () => setIsMuted(player.isMuted());
            const updateBuffered = () => {
                const bufferedEnd = player.getBufferedEnd();
                if (bufferedEnd > 0) setBufferedTime(bufferedEnd);
            };

            const handleEnded = () => {
                if (!nextItem) return;
                markItemAsCompleted(item.Id);
                navigate(buildPlayerUrl(nextItem.Id!), { mode: 'replace' });
            };

            player.on('play', updatePlayState);
            player.on('pause', updatePlayState);
            player.on('timeupdate', updateTime);
            player.on('timeupdate', updateBuffered);
            player.on('loadedmetadata', updateDuration);
            player.on('progress', updateBuffered);
            player.on('volumechange', updateMuted);
            player.on('ended', handleEnded);

            return () => {
                player.off('play', updatePlayState);
                player.off('pause', updatePlayState);
                player.off('timeupdate', updateTime);
                player.off('timeupdate', updateBuffered);
                player.off('loadedmetadata', updateDuration);
                player.off('progress', updateBuffered);
                player.off('volumechange', updateMuted);
                player.off('ended', handleEnded);
            };
        }, [player, nextItem, item.Id, navigate, markItemAsCompleted]);

        const togglePlay = useCallback(() => {
            if (!player) return;
            if (player.isPaused()) {
                player.play();
            } else {
                player.pause();
            }
            resetHideTimeout();
        }, [player, resetHideTimeout]);

        const setPlaying = useCallback(
            (playing: boolean) => {
                if (!player) return;
                if (playing) {
                    player.play();
                } else {
                    player.pause();
                }
                resetHideTimeout();
            },
            [player, resetHideTimeout]
        );

        useEffect(() => {
            getNavigationAdapter().registerMediaKeys();
        }, []);

        useEffect(() => {
            function handleMediaKeyDown(event: KeyboardEvent) {
                const action = MEDIA_KEY_ACTIONS[event.key] ?? MEDIA_KEY_CODES[event.keyCode];
                if (!action) return;
                if (action === 'toggle') {
                    togglePlay();
                } else {
                    setPlaying(action === 'play');
                }
            }

            window.addEventListener('keydown', handleMediaKeyDown);
            return () => window.removeEventListener('keydown', handleMediaKeyDown);
        }, [togglePlay, setPlaying]);

        const toggleMute = useCallback(() => {
            if (!player) return;
            player.setMuted(!isMuted);
        }, [player, isMuted]);

        const handleSeekBackward = useCallback(() => {
            if (!player) return;
            player.seekTo(Math.max(0, player.getCurrentTime() - SEEK_SECONDS));
        }, [player]);

        const handleSeekForward = useCallback(() => {
            if (!player) return;
            player.seekTo(Math.min(duration, player.getCurrentTime() + SEEK_SECONDS));
        }, [player, duration]);

        const handleAudioTrackChange = (index: number) => {
            onAudioTrackChange(index);
            setLastAudioLanguage(item.Id || '', index);
            closeTrackMenu();
        };

        const handleSubtitleTrackChange = (index: number | null) => {
            if (index === null) {
                onSubtitleTrackChange(null);
                removeLastSubtitleLanguage(item.Id || '');
            } else {
                onSubtitleTrackChange(index);
                setLastSubtitleLanguage(item.Id || '', index);
            }
            closeTrackMenu();
        };

        const getMediaSegment = (type: MediaSegmentType) => {
            if (!mediaSegments || mediaSegments.length === 0) return null;
            return mediaSegments.find((segment) => segment.Type === type) || null;
        };

        const handleSkipSegment = (type: MediaSegmentType) => {
            if (!player) return;
            const segment = getMediaSegment(type);
            if (segment?.EndTicks) {
                player.seekTo(ticksToSeconds(segment.EndTicks));
            }
            setFocus(playPauseFocusKey);
        };

        const introSegment = getMediaSegment('Intro');
        const showSkipIntroButton =
            introSegment &&
            introSegment.StartTicks != null &&
            introSegment.EndTicks != null &&
            currentTime > ticksToSeconds(introSegment.StartTicks) &&
            currentTime < ticksToSeconds(introSegment.EndTicks);

        const outtroSegment = getMediaSegment('Outro');
        const showSkipOutroButton =
            outtroSegment &&
            outtroSegment.StartTicks != null &&
            outtroSegment.EndTicks != null &&
            currentTime > ticksToSeconds(outtroSegment.StartTicks) &&
            currentTime < ticksToSeconds(outtroSegment.EndTicks);

        const clampedCurrentTime = duration > 0 ? Math.min(currentTime, duration) : currentTime;
        const progressPercentage = Math.min(
            100,
            duration > 0 ? (clampedCurrentTime / duration) * 100 : 0
        );
        const bufferedPercentage = Math.min(
            100,
            duration > 0 ? (bufferedTime / duration) * 100 : 0
        );

        const title =
            item.Type === 'Episode'
                ? `${item.SeriesName} - S${item.ParentIndexNumber}E${item.IndexNumber} - ${item.Name}`
                : item.Name;

        const backButtonImageId = item.Type === 'Episode' ? item.SeriesId : item.Id;
        const backButtonImageTag = item.Type === 'Episode' ? undefined : item.ImageTags?.Logo;

        const isLive = item.Type === 'TvChannel';

        const audioStreams = item.MediaStreams?.filter((s) => s.Type === 'Audio') || [];
        const subtitleStreams = item.MediaStreams?.filter((s) => s.Type === 'Subtitle') || [];

        const timeRemaining = duration - currentTime;
        const showNextItemPrompt =
            nextItem &&
            duration > 0 &&
            !dismissedNextItemPrompt &&
            (timeRemaining <= 30 || (duration > 0 && currentTime / duration >= 0.95));

        return (
            <>
                <div
                    className="absolute top-0 left-0 w-full p-4 bg-linear-to-b from-black/80 to-transparent z-50 text-gray-200 text-lg flex items-center gap-2 transition-opacity duration-300"
                    style={{
                        opacity: showControls ? 1 : 0,
                        pointerEvents: showControls ? 'auto' : 'none',
                    }}
                >
                    <FocusableButton variant="ghost" floating onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </FocusableButton>
                    {backButtonLogoFailed ? (
                        <h1>{title}</h1>
                    ) : (
                        <img
                            className="h-9 object-contain"
                            src={getLogoUrl(
                                backButtonImageId!,
                                { maxHeight: 140 },
                                backButtonImageTag
                            )}
                            onError={() => setBackButtonLogoFailed(true)}
                        />
                    )}
                </div>

                <div className="absolute bottom-40 right-8 z-30 flex gap-2">
                    {showSkipIntroButton && !showNextItemPrompt && (
                        <FocusableButton
                            autoFocus
                            variant="default"
                            floating
                            onClick={() => handleSkipSegment('Intro')}
                        >
                            <SkipForward />
                            {t('player:skipIntro')}
                        </FocusableButton>
                    )}
                    {showSkipOutroButton && !showNextItemPrompt && (
                        <FocusableButton
                            autoFocus
                            variant="default"
                            floating
                            onClick={() => handleSkipSegment('Outro')}
                        >
                            <SkipForward />
                            {t('player:skipOutro')}
                        </FocusableButton>
                    )}
                    {showNextItemPrompt && (
                        <div className="w-80 rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
                            <h3 className="text-lg font-semibold">
                                {t('player:upNext', { seconds: timeRemaining.toFixed(0) })}
                            </h3>
                            <img
                                src={getPrimaryImageUrl(nextItem.Id!, {
                                    height: 180,
                                    width: 320,
                                })}
                                alt={nextItem.Name || t('player:nextItemPoster')}
                                className="w-full h-auto rounded"
                            />
                            <p>
                                S{nextItem.ParentIndexNumber}E{nextItem.IndexNumber} ⋅{' '}
                                {nextItem.Name}
                            </p>
                            <p className="text-muted-foreground text-xs mb-2">
                                {ticksToReadableTime(nextItem.RunTimeTicks || 0)}
                            </p>
                            <div className="flex items-center gap-2">
                                <FocusableButton
                                    autoFocus
                                    className="flex-1"
                                    onClick={() => {
                                        if (!player) return;
                                        player.pause();
                                        markItemAsCompleted(item.Id);
                                        navigate(buildPlayerUrl(nextItem.Id!), { mode: 'replace' });
                                    }}
                                >
                                    <SkipForward />
                                    {t('player:startNow')}
                                </FocusableButton>
                                <FocusableButton
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setDismissedNextItemPrompt(true);
                                        setFocus(playPauseFocusKey);
                                    }}
                                >
                                    {t('player:dismiss')}
                                </FocusableButton>
                            </div>
                        </div>
                    )}
                </div>

                {openMenu && (
                    <TrackMenuPanel
                        title={
                            openMenu === 'audio' ? t('player:audioTracks') : t('common:subtitles')
                        }
                        onClose={closeTrackMenu}
                    >
                        {openMenu === 'subtitle' && (
                            <TrackOption
                                label={t('player:off')}
                                selected={subtitleTrackIndex === null}
                                autoFocus
                                onClick={() => handleSubtitleTrackChange(null)}
                            />
                        )}
                        {(openMenu === 'audio' ? audioStreams : subtitleStreams).map(
                            (stream, index) => (
                                <TrackOption
                                    key={stream.Index ?? index}
                                    label={
                                        openMenu === 'audio'
                                            ? t('player:audioTrackLabel', {
                                                  language:
                                                      stream.Language ||
                                                      t('player:unknownLanguage'),
                                                  codec: stream.Codec,
                                              })
                                            : stream.DisplayTitle ||
                                              stream.Language ||
                                              t('player:unknown')
                                    }
                                    selected={
                                        openMenu === 'audio'
                                            ? audioTrackIndex === stream.Index
                                            : subtitleTrackIndex === index
                                    }
                                    autoFocus={openMenu === 'audio' && index === 0}
                                    onClick={() =>
                                        openMenu === 'audio'
                                            ? handleAudioTrackChange(stream.Index!)
                                            : handleSubtitleTrackChange(index)
                                    }
                                />
                            )
                        )}
                    </TrackMenuPanel>
                )}

                <div
                    className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/80 to-transparent p-4 transition-opacity duration-300"
                    style={{
                        opacity: showControls ? 1 : 0,
                        pointerEvents: showControls ? 'auto' : 'none',
                    }}
                >
                    {!isLive && (
                        <div className="w-full h-3 rounded mb-4 relative">
                            <div className="absolute top-1 left-0 w-full h-1 bg-gray-600 rounded pointer-events-none z-0" />
                            <div
                                className="absolute top-1 left-0 h-1 bg-gray-500 rounded pointer-events-none z-5"
                                style={{ width: `${bufferedPercentage}%` }}
                            />
                            <div
                                className="absolute top-1 left-0 h-1 bg-brand rounded pointer-events-none z-15 transition-[width] duration-250 ease-linear"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between text-white gap-4">
                        <div className="flex items-center gap-2">
                            {previousItem && (
                                <FocusableButton
                                    variant="ghost"
                                    size="icon-lg"
                                    floating
                                    title={t('player:previousItem')}
                                    onClick={() =>
                                        navigate(buildPlayerUrl(previousItem.Id!), {
                                            mode: 'replace',
                                        })
                                    }
                                >
                                    <SkipBack size={24} />
                                </FocusableButton>
                            )}
                            {!isLive && (
                                <FocusableButton
                                    variant="ghost"
                                    size="icon-lg"
                                    floating
                                    title={t('player:rewind10')}
                                    onClick={handleSeekBackward}
                                >
                                    <Rewind size={24} />
                                </FocusableButton>
                            )}
                            <FocusableButton
                                autoFocus
                                focusKey={playPauseFocusKey}
                                variant="ghost"
                                size="icon-lg"
                                floating
                                onClick={togglePlay}
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </FocusableButton>
                            {!isLive && (
                                <FocusableButton
                                    variant="ghost"
                                    size="icon-lg"
                                    floating
                                    title={t('player:forward10')}
                                    onClick={handleSeekForward}
                                >
                                    <FastForward size={24} />
                                </FocusableButton>
                            )}
                            {nextItem && (
                                <FocusableButton
                                    variant="ghost"
                                    size="icon-lg"
                                    floating
                                    title={t('player:nextItem')}
                                    onClick={() =>
                                        navigate(buildPlayerUrl(nextItem.Id!), { mode: 'replace' })
                                    }
                                >
                                    <SkipForward size={24} />
                                </FocusableButton>
                            )}
                            {isLive ? (
                                <div className="flex items-center gap-1.5 text-sm ml-2">
                                    <Dot className="text-red-500 -mx-1" size={32} />
                                    {t('player:live')}
                                </div>
                            ) : (
                                <div className="text-sm ml-2">
                                    {formatPlayTime(clampedCurrentTime)} /{' '}
                                    {formatPlayTime(duration)}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {subtitleStreams.length > 0 && (
                                <FocusableButton
                                    variant="ghost"
                                    size="icon-lg"
                                    floating
                                    onClick={() => setOpenMenu('subtitle')}
                                >
                                    <Subtitles />
                                </FocusableButton>
                            )}
                            {audioStreams.length > 1 && (
                                <FocusableButton
                                    variant="ghost"
                                    size="icon-lg"
                                    floating
                                    onClick={() => setOpenMenu('audio')}
                                >
                                    <AudioLines />
                                </FocusableButton>
                            )}
                            <FocusableButton
                                variant="ghost"
                                size="icon-lg"
                                floating
                                onClick={toggleMute}
                            >
                                {isMuted ? <VolumeX /> : <Volume2 />}
                            </FocusableButton>
                        </div>
                    </div>
                </div>
            </>
        );
    }
);

function TrackMenuPanel({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const { t } = useTranslation('common');
    const { ref, focusKey } = useLayerFocusable<object, HTMLDivElement>({
        isFocusBoundary: true,
        focusable: false,
    });

    return (
        <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-end p-8">
            <div
                ref={ref}
                className="w-96 max-h-full overflow-auto rounded-lg border border-border bg-card p-4 flex flex-col gap-2"
            >
                <h3 className="text-lg font-semibold mb-1">{title}</h3>
                <FocusContext.Provider value={focusKey}>
                    {children}
                    <FocusableButton variant="outline" className="mt-2" onClick={onClose}>
                        {t('close')}
                    </FocusableButton>
                </FocusContext.Provider>
            </div>
        </div>
    );
}

function TrackOption({
    label,
    selected,
    autoFocus,
    onClick,
}: {
    label: string;
    selected: boolean;
    autoFocus?: boolean;
    onClick: () => void;
}) {
    const { ref, focused, focusSelf } = useLayerFocusable<object, HTMLButtonElement>({
        onEnterPress: () => ref.current?.click(),
    });

    useEffect(() => {
        if (autoFocus) focusSelf();
    }, [autoFocus, focusSelf]);

    return (
        <Button
            ref={ref}
            variant="ghost"
            onClick={onClick}
            className={cn(
                'justify-start gap-2',
                focused ? FOCUS_RING_COMPACT : selected && 'bg-muted'
            )}
        >
            {selected ? <Check className="shrink-0" /> : <span className="w-4 shrink-0" />}
            <span className="truncate">{label}</span>
        </Button>
    );
}

export default PlayerControls;
