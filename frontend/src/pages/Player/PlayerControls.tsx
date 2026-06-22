import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    ArrowLeft,
    PictureInPicture2,
    AudioLines,
    SkipForward,
    Subtitles,
    Dot,
    Info,
    Minimize,
    SkipBack,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type {
    BaseItemDto,
    MediaSegmentDto,
    MediaSegmentType,
    TrickplayInfoDto,
} from '@jellyfin/sdk/lib/generated-client/models';
import { Slider } from '../../components/ui/slider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPlayTime, ticksToReadableTime, ticksToSeconds } from '@/utils/timeConversion';
import { buildPlayerUrl } from '@/utils/playerUrl';
import { useTranslation } from 'react-i18next';
import { usePlayerKeyboardControls } from '@/hooks/usePlayerKeyboardControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPrimaryImageUrl, getTrickplayImageUrl } from '@/utils/jellyfinUrls';
import { useReportPlaybackProgress } from '@/hooks/api/usePlaybackProgress';
import { getRuntimePlaybackStats, type RuntimePlaybackStats } from '@/utils/playbackStats';
import { useSession } from '@/hooks/api/useSession';
import {
    removeLastSubtitleLanguage,
    setLastAudioLanguage,
    setLastSubtitleLanguage,
} from '@/utils/localstorageLastlanguage';

function getPrimaryTrickplayInfo(trickplay?: BaseItemDto['Trickplay']) {
    if (!trickplay) return null;

    const entries = Object.values(trickplay);
    if (entries.length === 0) return null;
    const subEntries = Object.values(entries[0]);
    return subEntries[0] || null;
}

function getTrickplayTile(time: number, trickplay: TrickplayInfoDto) {
    const interval = trickplay.Interval ?? 1;
    const tileWidth = trickplay.TileWidth ?? 1;
    const tileHeight = trickplay.TileHeight ?? 1;

    const timeMs = time * 1000;
    const thumbnailIndex = Math.floor(timeMs / interval);
    const tilesPerImage = tileWidth * tileHeight;

    const imageIndex = Math.floor(thumbnailIndex / tilesPerImage);
    const tileIndex = thumbnailIndex % tilesPerImage;

    const x = tileIndex % tileWidth;
    const y = Math.floor(tileIndex / tileWidth);

    // console.log({
    //     time,
    //     interval: trickplay.Interval,
    //     thumbnailIndex,
    //     tilesPerImage,
    //     imageIndex,
    //     totalImages: Math.ceil((trickplay.ThumbnailCount ?? 0) / tilesPerImage),
    // });

    return {
        thumbnailIndex,
        imageIndex,
        x,
        y,
        width: trickplay.Width,
        height: trickplay.Height,
    };
}

interface PlayerControlsProps {
    item: BaseItemDto;
    player: ReturnType<typeof import('video.js').default> | null;
    audioTrackIndex: number | null;
    onAudioTrackChange: (index: number) => void;
    subtitleTrackIndex: number | null;
    onSubtitleTrackChange: (index: number | null) => void;
    isFullscreen: boolean;
    onFullscreenToggle?: () => void;
    mediaSegments?: MediaSegmentDto[];
    previousItem?: BaseItemDto | null;
    nextItem?: BaseItemDto | null;
    srcUrl: string;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

const PlayerControls = ({
    item,
    player,
    audioTrackIndex,
    onAudioTrackChange,
    subtitleTrackIndex,
    onSubtitleTrackChange,
    isFullscreen,
    onFullscreenToggle,
    mediaSegments,
    previousItem,
    nextItem,
    srcUrl,
    containerRef,
}: PlayerControlsProps) => {
    const { t } = useTranslation('player');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferedTime, setBufferedTime] = useState(0);
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('playerVolume');
        return saved ? parseFloat(saved) : 1;
    });
    const [isMuted, setIsMuted] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState<number>(0);
    const [showControls, setShowControls] = useState(true);
    const [isPiP, setIsPiP] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const backUrl = searchParams.get('backUrl');
    const { reportProgress } = useReportPlaybackProgress();
    const [dismissedNextItemPrompt, setDismissedNextItemPrompt] = useState(false);
    const [stats, setStats] = useState<RuntimePlaybackStats | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const { data: session } = useSession(item.Id, showStats);

    const handleBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            navigate(-1);
        }
    };

    useEffect(() => {
        setContainer(containerRef.current);
    }, [containerRef]);

    useEffect(() => {
        if (!player) return;
        const update = () =>
            setStats(getRuntimePlaybackStats(player, item, session, audioTrackIndex, srcUrl));
        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, [player, item, session, audioTrackIndex, srcUrl, showStats]);

    const resetHideTimeout = () => {
        setShowControls(true);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    const handleMouseMove = () => {
        resetHideTimeout();
    };

    const handleMouseLeave = () => {
        setShowControls(false);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
    };

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

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('playerVolume', volume.toString());
    }, [volume]);

    useEffect(() => {
        if (!player || player.isDisposed?.()) return;

        player.volume(volume);

        const updatePlayState = () => setIsPlaying(!player.paused());
        const updateTime = () => setCurrentTime(player.currentTime() || 0);
        const updateDuration = () => setDuration(player.duration() || 0);
        const updateMuted = () => setIsMuted(player.muted() || false);
        const updateBuffered = () => {
            const buffered = player.buffered();
            if (buffered && buffered.length > 0) {
                setBufferedTime(buffered.end(buffered.length - 1));
            }
        };

        const handleEnded = () => {
            if (!nextItem) return;
            markItemAsCompleted(item.Id);
            navigate(buildPlayerUrl(nextItem.Id!, backUrl ?? undefined));
        };

        // PiP event listeners
        const videoEl = player.el()?.querySelector('video');
        const handleEnterPiP = () => setIsPiP(true);
        const handleLeavePiP = () => setIsPiP(false);
        if (videoEl) {
            videoEl.addEventListener('enterpictureinpicture', handleEnterPiP);
            videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);
        }

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

            if (videoEl) {
                videoEl.removeEventListener('enterpictureinpicture', handleEnterPiP);
                videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
            }
        };
    }, [
        player,
        volume,
        nextItem,
        dismissedNextItemPrompt,
        item.Id,
        navigate,
        markItemAsCompleted,
        backUrl,
    ]);

    const togglePlay = useCallback(() => {
        if (!player) return;
        if (player.paused()) {
            player.play();
        } else {
            player.pause();
        }
    }, [player]);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!player || !progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        player.currentTime(percentage * duration);
    };

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        setHoverTime(percentage * duration);
        setHoverPosition(x);
    };

    const handleProgressLeave = () => {
        setHoverTime(null);
    };

    const togglePiP = useCallback(async () => {
        if (!player) return;
        const videoEl = player.el()?.querySelector('video');
        if (!videoEl) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await videoEl.requestPictureInPicture();
            }
        } catch (error) {
            console.error('Error toggling PiP:', error);
        }
    }, [player]);

    const handleVolumeChange = (values: number[]) => {
        if (!player || values.length === 0) return;
        const newVolume = values[0];
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) player.muted(false);
        if (newVolume === 0 && !isMuted) player.muted(true);
        player.volume(newVolume);
    };

    const toggleMute = useCallback(() => {
        if (!player) return;
        player.muted(!isMuted);
    }, [player, isMuted]);

    const toggleFullscreen = useCallback(() => {
        onFullscreenToggle?.();
    }, [onFullscreenToggle]);

    const handleAudioTrackChange = (value: string) => {
        const index = parseInt(value, 10);
        onAudioTrackChange(index);
        setLastAudioLanguage(item.Id || '', index);
    };

    const handleSubtitleTrackChange = (value: string) => {
        if (value === 'off') {
            onSubtitleTrackChange(null);
            removeLastSubtitleLanguage(item.Id || '');
        } else {
            const index = parseInt(value, 10);
            onSubtitleTrackChange(index);
            setLastSubtitleLanguage(item.Id || '', index);
        }
    };

    const getMediaSegment = (type: MediaSegmentType) => {
        if (!mediaSegments || mediaSegments.length === 0) return null;
        return mediaSegments.find((segment) => segment.Type === type) || null;
    };

    const handleSkipSegment = (type: MediaSegmentType) => {
        if (!player) return;
        const segment = getMediaSegment(type);
        if (segment?.EndTicks) {
            const endSeconds = ticksToSeconds(segment.EndTicks);
            player.currentTime(endSeconds);
        }
    };

    const handleSeekBackward = useCallback(() => {
        if (!player) return;
        const newTime = Math.max(0, (player.currentTime() || 0) - 10);
        player.currentTime(newTime);
    }, [player]);

    const handleSeekForward = useCallback(() => {
        if (!player) return;
        const newTime = Math.min(duration, (player.currentTime() || 0) + 10);
        player.currentTime(newTime);
    }, [player, duration]);

    usePlayerKeyboardControls({
        togglePlay,
        toggleMute,
        toggleFullscreen,
        togglePiP,
        handleSeekBackward,
        handleSeekForward,
    });

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
    const bufferedPercentage = Math.min(100, duration > 0 ? (bufferedTime / duration) * 100 : 0);

    const title =
        item.Type === 'Episode'
            ? `${item.SeriesName} - S${item.ParentIndexNumber}E${item.IndexNumber} - ${item.Name}`
            : item.Name;

    const audioStreams = item.MediaStreams?.filter((s) => s.Type === 'Audio') || [];
    const subtitleStreams = item.MediaStreams?.filter((s) => s.Type === 'Subtitle') || [];

    const timeRemaining = duration - currentTime;
    const showNextItemPrompt =
        nextItem &&
        duration > 0 &&
        !dismissedNextItemPrompt &&
        (timeRemaining <= 30 || // 30 sec remaining
            (duration > 0 && currentTime / duration >= 0.95)); // or 95% complete

    return (
        <>
            <div
                className="absolute top-0 left-0 w-full p-4 bg-linear-to-b from-black/80 to-transparent z-20 text-gray-200 text-lg flex items-center gap-2 transition-opacity duration-300"
                style={{
                    opacity: showControls ? 1 : 0,
                    pointerEvents: showControls ? 'auto' : 'none',
                }}
                onMouseMove={handleMouseMove}
            >
                <Button variant="ghost" onClick={handleBack}>
                    <ArrowLeft />
                </Button>
                <h1>{title}</h1>
            </div>
            <div
                className={`absolute inset-0 z-10 p-4 ${showControls ? '' : 'cursor-none'}`}
                onClick={togglePlay}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />
            <div className="absolute bottom-28 right-8 z-30 flex gap-2">
                {showSkipIntroButton && !showNextItemPrompt && (
                    <Button
                        variant={'default'}
                        onClick={() => handleSkipSegment('Intro')}
                        className="cursor-pointer"
                        title={t('skipIntro')}
                    >
                        <SkipForward />
                        {t('skipIntro')}
                    </Button>
                )}
                {showSkipOutroButton && !showNextItemPrompt && (
                    <Button
                        variant={'default'}
                        onClick={() => handleSkipSegment('Outro')}
                        className="cursor-pointer"
                        title={t('skipOutro')}
                    >
                        <SkipForward />
                        {t('skipOutro')}
                    </Button>
                )}
                {showNextItemPrompt && (
                    <Card className="gap-2 w-60 md:w-80">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl">
                                {t('upNext', {
                                    seconds: timeRemaining.toFixed(0),
                                })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col">
                            <img
                                src={getPrimaryImageUrl(nextItem.Id!, {
                                    height: 180,
                                    width: 320,
                                })}
                                alt={nextItem.Name || 'Next item poster'}
                                className="w-full h-auto rounded mb-3 hidden sm:block"
                            />
                            <div className="flex items-center">
                                <p>
                                    {t('seasonEpisode', {
                                        season: nextItem.ParentIndexNumber,
                                        episode: nextItem.IndexNumber,
                                    })}{' '}
                                    ⋅ {nextItem.Name}
                                </p>
                            </div>
                            <div className="flex items-center text-muted-foreground text-xs mb-3">
                                <p>{ticksToReadableTime(nextItem.RunTimeTicks || 0)}</p>
                                <Dot />
                                <p>Ends at {formatPlayTime(duration)}</p>
                            </div>
                            <div className="flex items-center gap-2 w-full">
                                <Button
                                    variant={'default'}
                                    className="flex-1"
                                    onClick={() => {
                                        if (!player || !nextItem) return;
                                        player.pause();
                                        markItemAsCompleted(item.Id);
                                        navigate(
                                            buildPlayerUrl(nextItem.Id!, backUrl ?? undefined)
                                        );
                                    }}
                                >
                                    <SkipForward />
                                    {t('startNow')}
                                </Button>
                                <Button
                                    variant={'outline'}
                                    className="flex-1"
                                    onClick={() => {
                                        setDismissedNextItemPrompt(true);
                                    }}
                                >
                                    {t('dismiss')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            <div
                className={`absolute top-18 left-8 z-30 p-4 bg-black/70 text-white text-sm rounded-md max-w-sm ${showStats && stats ? '' : 'hidden'}`}
                style={{
                    pointerEvents: showStats && stats ? 'auto' : 'none',
                }}
                onMouseEnter={handleMouseMove}
                onMouseMove={handleMouseMove}
            >
                {stats && (
                    <div>
                        <h4 className="mb-1">Playback Info</h4>
                        <div className="ml-2">
                            <p>
                                <span>Player</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.playbackInfo.player}
                                </span>
                            </p>
                            <p>
                                <span>Play method</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.playbackInfo.transcoding ? 'Transcoded' : 'Direct'}
                                </span>
                            </p>
                            <p>
                                <span>Protocol</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.playbackInfo.protocol}
                                </span>
                            </p>
                        </div>
                        <h4 className="mb-1 mt-3">Video Info</h4>
                        <div className="ml-2">
                            <p>
                                <span>Video Resolution</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.videoInfo.videoResolution.width}x
                                    {stats.videoInfo.videoResolution.height}
                                </span>
                            </p>
                            <p>
                                <span>Player Dimensions</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.videoInfo.playerDimensions.width}x
                                    {stats.videoInfo.playerDimensions.height}
                                </span>
                            </p>
                            <p>
                                <span>Dropped Frames</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.videoInfo.droppedFrames}
                                </span>
                            </p>
                            <p>
                                <span>Corrupted Frames</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.videoInfo.corruptedFrames}
                                </span>
                            </p>
                            <p>
                                <span>Total Frames</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.videoInfo.totalFrames}
                                </span>
                            </p>
                        </div>
                        <h4 className="mb-1 mt-3">Media Info</h4>
                        <div className="ml-2">
                            <p>
                                <span>Video Codec</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.mediaInfo.videoCodec}
                                </span>
                            </p>
                            <p>
                                <span>Video Bitrate</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.mediaInfo.videoBitrateKbps ?? 'N/A'} kbps
                                </span>
                            </p>
                            <p>
                                <span>Video Range Type</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.mediaInfo.videoRangeType || 'N/A'}
                                </span>
                            </p>
                            <p>
                                <span>Audio Codec</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.mediaInfo.audioCodec}
                                </span>
                            </p>
                            <p>
                                <span>Audio Bitrate</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.mediaInfo.audioBitrateKbps ?? 'N/A'} kbps
                                </span>
                            </p>
                            <p>
                                <span>Audio Channels</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.mediaInfo.audioChannels}
                                </span>
                            </p>
                            <p>
                                <span>Audio Sample Rate</span>{' '}
                                <span className="text-muted-foreground">
                                    {stats.mediaInfo.audioSampleRate} Hz
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <div
                className="absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/80 to-transparent p-4 transition-opacity duration-300"
                style={{
                    opacity: showControls ? 1 : 0,
                    pointerEvents: showControls ? 'auto' : 'none',
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Progress bar */}
                <div
                    ref={progressRef}
                    className="w-full h-3 rounded cursor-pointer mb-4 transition-all relative"
                    onClick={handleProgressClick}
                    onMouseMove={handleProgressHover}
                    onMouseLeave={handleProgressLeave}
                >
                    {/* Actually visible bar that's smaller for better asthetics */}
                    <div className="absolute top-1 left-0 w-full h-1 bg-gray-600 rounded pointer-events-none z-0" />
                    {/* buffered progress */}
                    <div
                        className="absolute top-1 left-0 h-1 bg-gray-500 rounded pointer-events-none z-5"
                        style={{ width: `${bufferedPercentage}%` }}
                    />
                    {/** Bar that shows the hovered time */}
                    <div
                        className="absolute top-1 left-0 h-1 bg-white/20 rounded pointer-events-none z-10"
                        style={{
                            width: hoverTime !== null ? `${(hoverTime / duration) * 100}%` : '0%',
                        }}
                    />
                    {/* current progress */}
                    <div
                        className="absolute top-1 left-0 h-1 bg-brand rounded pointer-events-none z-15"
                        style={{ width: `${progressPercentage}%` }}
                    />
                    {/* Hover preview */}
                    {hoverTime !== null &&
                        item.Trickplay &&
                        (() => {
                            const trickplayInfo = getPrimaryTrickplayInfo(item.Trickplay);
                            if (!trickplayInfo || hoverTime === null) return null;

                            const { imageIndex, x, y, width, height } = getTrickplayTile(
                                hoverTime,
                                trickplayInfo
                            );

                            const previewWidth = width || 320;
                            const halfWidth = previewWidth / 2;
                            const clampedPosition = Math.max(
                                halfWidth,
                                Math.min(hoverPosition, window.innerWidth - halfWidth)
                            );

                            return (
                                <div
                                    className="absolute bottom-4 -translate-x-1/2 text-white pointer-events-none z-40 flex flex-col items-center"
                                    style={{ left: `${clampedPosition}px` }}
                                >
                                    <div
                                        className="relative overflow-hidden rounded-md mb-1"
                                        style={{
                                            width: width,
                                            height: height,
                                        }}
                                    >
                                        <img
                                            src={getTrickplayImageUrl(
                                                item.Id!,
                                                width || 320,
                                                imageIndex
                                            )}
                                            style={{
                                                position: 'absolute',
                                                left: -x * (width || 0),
                                                top: -y * (height || 0),
                                                maxWidth: 'none',
                                            }}
                                            draggable={false}
                                        />
                                    </div>
                                    <div className="text-center bg-black/90 p-1 px-2 rounded-md w-min">
                                        {formatPlayTime(hoverTime)}
                                    </div>
                                </div>
                            );
                        })()}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between text-white gap-4">
                    <div className="flex items-center gap-2">
                        {previousItem && (
                            <Button
                                variant={'ghost'}
                                size={'icon-lg'}
                                className="cursor-pointer"
                                title={t('previousItem')}
                                asChild
                            >
                                <Link to={buildPlayerUrl(previousItem.Id!, backUrl ?? undefined)}>
                                    <SkipBack size={24} />
                                </Link>
                            </Button>
                        )}
                        <Button
                            variant={'ghost'}
                            size={'icon-lg'}
                            onClick={togglePlay}
                            className="cursor-pointer"
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </Button>
                        {nextItem && (
                            <Button
                                variant={'ghost'}
                                size={'icon-lg'}
                                className="cursor-pointer"
                                title={t('nextItem')}
                                asChild
                            >
                                <Link to={buildPlayerUrl(nextItem.Id!, backUrl ?? undefined)}>
                                    <SkipForward size={24} />
                                </Link>
                            </Button>
                        )}
                        <div className="text-sm ml-2">
                            {formatPlayTime(clampedCurrentTime)} / {formatPlayTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={'ghost'}
                            size={'icon-lg'}
                            onClick={() => setShowStats(!showStats)}
                            className="cursor-pointer"
                            title="Toggle Stats"
                        >
                            <Info />
                        </Button>
                        {subtitleStreams.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={'ghost'}
                                        size={'icon-lg'}
                                        className="cursor-pointer"
                                    >
                                        <Subtitles />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent container={container}>
                                    <DropdownMenuLabel>{t('subtitles')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={subtitleTrackIndex?.toString() || 'off'}
                                        onValueChange={handleSubtitleTrackChange}
                                    >
                                        <DropdownMenuRadioItem value="off">
                                            {t('off')}
                                        </DropdownMenuRadioItem>
                                        {subtitleStreams.map((stream, index) => (
                                            <DropdownMenuRadioItem
                                                key={index}
                                                value={index.toString()}
                                            >
                                                {stream.DisplayTitle ||
                                                    stream.Language ||
                                                    'Unknown'}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        {audioStreams.length > 1 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant={'ghost'}
                                        size={'icon-lg'}
                                        className="cursor-pointer"
                                    >
                                        <AudioLines />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent container={container}>
                                    <DropdownMenuLabel>{t('audioTracks')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={audioTrackIndex?.toString() || ''}
                                        onValueChange={handleAudioTrackChange}
                                    >
                                        {audioStreams.map((stream, index) => (
                                            <DropdownMenuRadioItem
                                                key={index}
                                                value={stream.Index!.toString()}
                                            >
                                                {stream.Language || 'Unknown Language'} -{' '}
                                                {stream.Codec}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <Button
                            variant={'ghost'}
                            size={'icon-lg'}
                            onClick={toggleMute}
                            className="cursor-pointer"
                        >
                            {isMuted ? <VolumeX /> : <Volume2 />}
                        </Button>
                        <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={isMuted ? [0] : [volume]}
                            onValueChange={handleVolumeChange}
                            className="w-25 cursor-pointer mr-2"
                        />
                        {document.pictureInPictureEnabled && (
                            <Button
                                variant={'ghost'}
                                size={'icon-lg'}
                                onClick={togglePiP}
                                className="cursor-pointer"
                                title="Picture in Picture"
                            >
                                <PictureInPicture2
                                    size={20}
                                    className={isPiP ? 'text-brand' : ''}
                                />
                            </Button>
                        )}
                        <Button
                            variant={'ghost'}
                            size={'icon-lg'}
                            onClick={toggleFullscreen}
                            className="cursor-pointer"
                        >
                            {isFullscreen ? <Minimize /> : <Maximize />}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlayerControls;
