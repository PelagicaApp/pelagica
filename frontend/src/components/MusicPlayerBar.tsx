import {
    ChevronDown,
    ListMusic,
    Pause,
    Play,
    Repeat2,
    Shuffle,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    XIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLyrics } from '@/features/lyrics/api/useLyrics';
import { processLyrics } from '@/features/lyrics/utils/lyrics';
import LyricsButton from '@/features/lyrics/LyricsButton';
import LyricsExpandedPanel from '@/features/lyrics/shell/LyricsExpandedPanel';
import LyricsInlinePanel from '@/features/lyrics/shell/LyricsInlinePanel';
import { cn } from '@/lib/utils';
import { lyricsPanelWidthClass } from '@/features/lyrics/constants';
import EqualizerPopover from '@/features/equalizer/EqualizerPopover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import MusicQueueSidebar from '@/pages/Music/MusicQueueSidebar';

const formatTime = (timeTicks: number) => {
    const timeSeconds = timeTicks / 10000000;
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = Math.floor(timeSeconds % 60)
        .toString()
        .padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const MusicPlayerBar = () => {
    const { t } = useTranslation('player');
    const {
        currentTrack,
        shuffle,
        toggleShuffle,
        repeat,
        setRepeat,
        isPlaying,
        play,
        togglePlayPause,
        skipNext,
        skipPrevious,
        currentTime,
        duration,
        seek,
        volume,
        setVolume,
        equalizerPreset,
        setEqualizerPreset,
        customEqualizerPresets,
        saveCustomEqualizerPreset,
        deleteCustomEqualizerPreset,
        setEqualizerPreviewBands,
        sleepFadeEnabled,
        startSleepFade,
        stopSleepFade,
        sleepFadeDurationMinutes,
        sleepFadeStartedAt,
        equalizerAvailable,
        clearPlayback,
    } = useMusicPlayback();
    const isMobile = useIsMobile();
    const [isExpanded, setIsExpanded] = useState(false);
    const [lyricsOpenTrackId, setLyricsOpenTrackId] = useState<string | null>(null);
    const [inlineLyricsTrackId, setInlineLyricsTrackId] = useState<string | null>(null);

    const { data: lyricsData, isPending: isLyricsLoading } = useLyrics(currentTrack?.id);
    const processedLyrics = processLyrics(lyricsData);
    const hasLyrics = !!processedLyrics;
    const showLyricsButton = isLyricsLoading || hasLyrics;

    const isLyricsOpen = lyricsOpenTrackId === currentTrack?.id;
    const showLyricsInline = inlineLyricsTrackId === currentTrack?.id;

    const handleLineClick = useCallback(
        (startTicks: number) => {
            seek(startTicks);
            if (!isPlaying) {
                play();
            }
        },
        [isPlaying, play, seek]
    );
    const toggleDesktopLyrics = useCallback(() => {
        setLyricsOpenTrackId((prev) =>
            prev === currentTrack?.id ? null : (currentTrack?.id ?? null)
        );
    }, [currentTrack?.id]);

    const toggleMobileLyrics = useCallback(() => {
        setInlineLyricsTrackId((prev) =>
            prev === currentTrack?.id ? null : (currentTrack?.id ?? null)
        );
    }, [currentTrack?.id]);

    if (!currentTrack) return null;

    const currentTimeSeconds = currentTime / 10000000;
    const durationSeconds = duration / 10000000;

    const lyricsPanelProps =
        processedLyrics &&
        ({
            track: currentTrack,
            lyrics: processedLyrics,
            currentTime,
            onLineClick: handleLineClick,
        } as const);

    if (isMobile && !isExpanded) {
        return (
            <div className="p-4 sm:px-12 sticky bottom-0 z-100">
                <div
                    className="bg-sidebar/90 border-sidebar-border flex justify-between items-center h-full w-full rounded-lg border shadow-sm p-3 backdrop-blur-lg cursor-pointer"
                    onClick={() => setIsExpanded(true)}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                            src={getPrimaryImageUrl(currentTrack.id, {
                                width: 64,
                                height: 64,
                            })}
                            alt="Album cover"
                            className="rounded-md h-12 w-12 object-cover shrink-0"
                        />
                        <div className="grid flex-1 text-left leading-tight min-w-0">
                            <span className="truncate font-medium">{currentTrack.title}</span>
                            <span className="truncate text-sm font-normal text-muted-foreground">
                                {currentTrack.artist}
                            </span>
                        </div>
                    </div>
                    {/* Queue toggle */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <ListMusic className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 min-w-70 sm:max-w-sm">
                            <MusicQueueSidebar />
                        </SheetContent>
                    </Sheet>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlayPause();
                        }}
                    >
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                </div>
            </div>
        );
    }

    if (isMobile && isExpanded) {
        return (
            <div className="fixed inset-0 z-200 bg-background/95 backdrop-blur-lg flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center p-4 border-b">
                    <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                        <ChevronDown />
                    </Button>
                    <span className="text-sm font-medium">
                        {showLyricsInline ? t('lyrics') : t('nowPlaying')}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={clearPlayback}>
                            <XIcon />
                        </Button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-6 gap-6">
                    {showLyricsInline && lyricsPanelProps ? (
                        <LyricsInlinePanel {...lyricsPanelProps} />
                    ) : (
                        <>
                            <div className="flex flex-1 flex-col items-center justify-center gap-6">
                                <img
                                    src={getPrimaryImageUrl(currentTrack.id, {
                                        width: 400,
                                        height: 400,
                                    })}
                                    alt="Album cover"
                                    className="rounded-lg w-full max-w-sm aspect-square object-cover shadow-2xl"
                                />

                                <div className="w-full max-w-sm flex flex-row">
                                    <div className="text-start">
                                        <h2 className="text-2xl font-bold truncate">
                                            {currentTrack.title}
                                        </h2>
                                        <p className="text-lg text-muted-foreground truncate">
                                            {currentTrack.artist}
                                        </p>
                                    </div>
                                    <div className="ml-auto justify-center">
                                        {showLyricsButton && (
                                            <LyricsButton
                                                active={showLyricsInline}
                                                loading={isLyricsLoading}
                                                onClick={toggleMobileLyrics}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="w-full max-w-sm mx-auto space-y-2 shrink-0">
                        <Slider
                            className="w-full"
                            max={durationSeconds}
                            step={0.1}
                            value={[currentTimeSeconds]}
                            onValueChange={(value) => seek(Math.floor(value[0] * 10000000))}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 w-full max-w-sm mx-auto shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={shuffle ? 'text-brand' : 'text-muted-foreground'}
                            onClick={toggleShuffle}
                        >
                            <Shuffle />
                        </Button>
                        <Button variant="ghost" size="icon-lg" onClick={skipPrevious}>
                            <SkipBack className="h-8 w-8" />
                        </Button>
                        <Button variant="default" size="icon-lg" onClick={togglePlayPause}>
                            {isPlaying ? (
                                <Pause className="h-8 w-8" />
                            ) : (
                                <Play className="h-8 w-8" />
                            )}
                        </Button>
                        <Button variant="ghost" size="icon-lg" onClick={skipNext}>
                            <SkipForward className="h-8 w-8" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={repeat ? 'text-brand' : 'text-muted-foreground'}
                            onClick={() => setRepeat(!repeat)}
                        >
                            <Repeat2 />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 w-full max-w-sm mx-auto shrink-0">
                        <EqualizerPopover
                            preset={equalizerPreset}
                            onPresetChange={setEqualizerPreset}
                            customPresets={customEqualizerPresets}
                            onSaveCustomPreset={saveCustomEqualizerPreset}
                            onDeleteCustomPreset={deleteCustomEqualizerPreset}
                            onPreviewBandsChange={setEqualizerPreviewBands}
                            sleepFadeEnabled={sleepFadeEnabled}
                            onStartSleepFade={startSleepFade}
                            onStopSleepFade={stopSleepFade}
                            sleepFadeDurationMinutes={sleepFadeDurationMinutes}
                            sleepFadeStartedAt={sleepFadeStartedAt}
                            isPlaying={isPlaying}
                            equalizerAvailable={equalizerAvailable}
                        />
                        {/* Queue toggle */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="ml-auto">
                                    <ListMusic className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="p-0 min-w-70 sm:max-w-sm">
                                <MusicQueueSidebar />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky bottom-0 z-100 w-full p-4 sm:px-12">
            <div className="relative">
                <div className="relative z-10 flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-sidebar/90 p-3 shadow-sm backdrop-blur-lg">
                    <div className="flex flex-1 items-center gap-2">
                        <img
                            src={getPrimaryImageUrl(currentTrack.id, {
                                width: 64,
                                height: 64,
                            })}
                            alt="Album cover"
                            className="rounded-md h-16 w-16 object-cover self-center"
                        />
                        <div className="grid flex-1 text-left leading-tight">
                            <span className="truncate font-medium">{currentTrack.title}</span>
                            <span className="truncate text-sm font-normal text-muted-foreground">
                                {currentTrack.artist}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`cursor-pointer ${shuffle ? 'text-brand' : 'text-muted-foreground'}`}
                                onClick={toggleShuffle}
                            >
                                <Shuffle />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer"
                                onClick={skipPrevious}
                            >
                                <SkipBack />
                            </Button>
                            <Button variant="default" size="icon-lg" onClick={togglePlayPause}>
                                {isPlaying ? <Pause /> : <Play />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer"
                                onClick={skipNext}
                            >
                                <SkipForward />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`cursor-pointer ${repeat ? 'text-brand' : 'text-muted-foreground'}`}
                                onClick={() => setRepeat(!repeat)}
                            >
                                <Repeat2 />
                            </Button>
                        </div>
                        <div className="flex w-full items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatTime(currentTime)}</span>
                            <Slider
                                className="flex-1"
                                max={durationSeconds}
                                step={0.1}
                                value={[currentTimeSeconds]}
                                onValueChange={(value) => seek(Math.floor(value[0] * 10000000))}
                            />
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2">
                        {showLyricsButton && (
                            <LyricsButton
                                active={isLyricsOpen}
                                loading={isLyricsLoading}
                                onClick={toggleDesktopLyrics}
                            />
                        )}
                        <EqualizerPopover
                            preset={equalizerPreset}
                            onPresetChange={setEqualizerPreset}
                            customPresets={customEqualizerPresets}
                            onSaveCustomPreset={saveCustomEqualizerPreset}
                            onDeleteCustomPreset={deleteCustomEqualizerPreset}
                            onPreviewBandsChange={setEqualizerPreviewBands}
                            sleepFadeEnabled={sleepFadeEnabled}
                            onStartSleepFade={startSleepFade}
                            onStopSleepFade={stopSleepFade}
                            sleepFadeDurationMinutes={sleepFadeDurationMinutes}
                            sleepFadeStartedAt={sleepFadeStartedAt}
                            isPlaying={isPlaying}
                            equalizerAvailable={equalizerAvailable}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            onClick={() => {
                                if (volume === 0) setVolume(0.5);
                                else setVolume(0);
                            }}
                        >
                            {volume === 0 ? <VolumeX /> : <Volume2 />}
                        </Button>
                        <Slider
                            className="w-32"
                            max={1}
                            step={0.01}
                            value={[volume]}
                            onValueChange={(value) => setVolume(value[0])}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="cursor-pointer ml-2"
                            onClick={clearPlayback}
                        >
                            <XIcon />
                        </Button>
                    </div>
                </div>
                {lyricsPanelProps && (
                    <div
                        className={cn(
                            'absolute bottom-full left-1/2 -translate-x-1/2 overflow-hidden',
                            'transition-[max-height] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                            lyricsPanelWidthClass,
                            isLyricsOpen ? 'max-h-[calc(70vh)]' : 'max-h-0'
                        )}
                    >
                        <div className="overflow-hidden rounded-t-lg border border-sidebar-border bg-sidebar/90 shadow-sm backdrop-blur-lg">
                            <LyricsExpandedPanel
                                {...lyricsPanelProps}
                                enabled={isLyricsOpen}
                                onClose={() => {
                                    setLyricsOpenTrackId(null);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicPlayerBar;
