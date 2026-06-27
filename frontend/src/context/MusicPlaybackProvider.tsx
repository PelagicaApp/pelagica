import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MusicPlaybackContext,
    type MusicPlaybackContextType,
    type MusicPlaybackTrack,
} from './MusicPlaybackContext';
import { getAudioStreamUrl } from '@/utils/jellyfinUrls';
import { usePlaybackStart } from '@/hooks/api/usePlaybackStart';
import { useReportPlaybackProgress } from '@/hooks/api/usePlaybackProgress';
import { usePlaybackStop } from '@/hooks/api/usePlaybackStop';
import { useMediaSession } from '@/hooks/useMediaSession';
import {
    EQUALIZER_PRESET_STORAGE_KEY,
    SLEEP_FADE_DURATION_STORAGE_KEY,
    SLEEP_FADE_STORAGE_KEY,
    clampSleepFadeDurationMinutes,
    getCustomPresetId,
    isCustomPresetSelection,
    loadStoredCustomPresets,
    loadStoredPreset,
    loadStoredSleepFadeDurationMinutes,
    loadStoredSleepFadeEnabled,
    resolvePresetBands,
    saveCustomPresets,
    sleepFadeMinutesToMs,
    type CustomEqualizerPreset,
    type EqualizerBand,
    type EqualizerSelection,
} from '@/features/equalizer/presets';
import { useAudioEqualizer } from '@/features/equalizer/useAudioEqualizer';

const VOLUME_STORAGE_KEY = 'music_volume';
const DEFAULT_VOLUME = 0.5;

const clampVolume = (v: number) => Math.min(1, Math.max(0, v));

export const MusicPlaybackProvider = ({ children }: PropsWithChildren) => {
    const audioRef = useRef<HTMLAudioElement>(new Audio());

    const [currentTrack, setCurrentTrack] = useState<MusicPlaybackTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(() => {
        if (typeof window === 'undefined') return DEFAULT_VOLUME;

        const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
        const parsed = stored ? Number(stored) : DEFAULT_VOLUME;

        return Number.isFinite(parsed) ? clampVolume(parsed) : DEFAULT_VOLUME;
    });
    const [customEqualizerPresets, setCustomEqualizerPresets] = useState(loadStoredCustomPresets);
    const [equalizerPreset, setEqualizerPresetState] = useState<EqualizerSelection>(() =>
        loadStoredPreset(loadStoredCustomPresets())
    );
    const [sleepFadeEnabled, setSleepFadeEnabledState] = useState(loadStoredSleepFadeEnabled);
    const [sleepFadeDurationMinutes, setSleepFadeDurationMinutesState] = useState(
        loadStoredSleepFadeDurationMinutes
    );
    const [sleepFadeStartedAt, setSleepFadeStartedAt] = useState<number | null>(() =>
        loadStoredSleepFadeEnabled() ? Date.now() : null
    );
    const [equalizerPreviewBands, setEqualizerPreviewBands] = useState<EqualizerBand[] | null>(
        null
    );
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [queue, setQueue] = useState<MusicPlaybackTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const { startPlayback } = usePlaybackStart();
    const { reportProgress } = useReportPlaybackProgress();
    const { stopPlayback } = usePlaybackStop();

    const queueRef = useRef<MusicPlaybackTrack[]>([]);
    const currentIndexRef = useRef(-1);
    const isPlayingRef = useRef(false);
    const currentTimeRef = useRef(0);
    const originalQueueRef = useRef<MusicPlaybackTrack[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressIntervalRef = useRef<any | null>(null);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);
    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    const shuffleArray = useCallback((array: MusicPlaybackTrack[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    const toggleShuffle = useCallback(() => {
        setShuffle((prev) => {
            if (!prev && queue.length && currentTrack) {
                originalQueueRef.current ||= [...queue];

                const others = queue.filter((_, i) => i !== currentIndex);
                const shuffled = shuffleArray(others);

                const newQueue = [...queue];
                let i = 0;
                for (let idx = 0; idx < newQueue.length; idx++) {
                    if (idx !== currentIndex) newQueue[idx] = shuffled[i++];
                }
                setQueue(newQueue);
            }

            if (prev && originalQueueRef.current.length && currentTrack) {
                const originalIndex = originalQueueRef.current.findIndex(
                    (t) => t.id === currentTrack.id
                );
                setQueue([...originalQueueRef.current]);
                if (originalIndex !== -1) setCurrentIndex(originalIndex);
            }

            return !prev;
        });
    }, [queue, currentIndex, currentTrack, shuffleArray]);

    const activeEqualizerBands = useMemo(() => {
        if (equalizerPreviewBands) return equalizerPreviewBands;
        return resolvePresetBands(equalizerPreset, customEqualizerPresets);
    }, [equalizerPreviewBands, equalizerPreset, customEqualizerPresets]);
    const isSleepPreset = equalizerPreset === 'sleep' && !equalizerPreviewBands;

    const pauseRef = useRef<() => void>(() => {});
    const onSleepFadeComplete = useCallback(() => {
        setSleepFadeStartedAt(null);
        setSleepFadeEnabledState(false);
        localStorage.setItem(SLEEP_FADE_STORAGE_KEY, 'false');
        pauseRef.current();
    }, []);

    const sleepFadeDurationMs = useMemo(
        () => sleepFadeMinutesToMs(sleepFadeDurationMinutes),
        [sleepFadeDurationMinutes]
    );

    const { equalizerAvailable, resumeContext, resetSleepFadeSession } = useAudioEqualizer({
        audioRef,
        bands: activeEqualizerBands,
        isSleepPreset,
        sleepFadeEnabled,
        sleepFadeStartedAt,
        sleepFadeDurationMs,
        volume,
        isPlaying,
        onSleepFadeComplete,
    });

    useEffect(() => {
        if (!equalizerAvailable) {
            audioRef.current.volume = volume;
        }
        localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
    }, [volume, equalizerAvailable]);

    const setEqualizerPreset = useCallback((preset: EqualizerSelection) => {
        setEqualizerPresetState(preset);
        localStorage.setItem(EQUALIZER_PRESET_STORAGE_KEY, preset);
    }, []);

    const saveCustomEqualizerPreset = useCallback((preset: CustomEqualizerPreset) => {
        setCustomEqualizerPresets((prev) => {
            const existingIndex = prev.findIndex((item) => item.id === preset.id);
            const next =
                existingIndex === -1
                    ? [...prev, preset]
                    : prev.map((item, index) => (index === existingIndex ? preset : item));
            saveCustomPresets(next);
            return next;
        });
    }, []);

    const deleteCustomEqualizerPreset = useCallback((id: string) => {
        setCustomEqualizerPresets((prev) => {
            const next = prev.filter((preset) => preset.id !== id);
            saveCustomPresets(next);
            return next;
        });

        setEqualizerPresetState((current) => {
            if (isCustomPresetSelection(current) && getCustomPresetId(current) === id) {
                localStorage.setItem(EQUALIZER_PRESET_STORAGE_KEY, 'flat');
                return 'flat';
            }
            return current;
        });
    }, []);

    const setSleepFadeEnabled = useCallback((enabled: boolean) => {
        setSleepFadeEnabledState(enabled);
        localStorage.setItem(SLEEP_FADE_STORAGE_KEY, enabled.toString());
    }, []);

    const startSleepFade = useCallback(
        (minutes: number) => {
            const clamped = clampSleepFadeDurationMinutes(minutes);
            setSleepFadeDurationMinutesState(clamped);
            localStorage.setItem(SLEEP_FADE_DURATION_STORAGE_KEY, clamped.toString());
            setEqualizerPresetState('sleep');
            localStorage.setItem(EQUALIZER_PRESET_STORAGE_KEY, 'sleep');
            setSleepFadeEnabled(true);
            setSleepFadeStartedAt(Date.now());
        },
        [setSleepFadeEnabled]
    );

    const stopSleepFade = useCallback(() => {
        setSleepFadeEnabled(false);
        setSleepFadeStartedAt(null);
    }, [setSleepFadeEnabled]);

    const prevSleepFadeDurationMsRef = useRef(sleepFadeDurationMs);
    useEffect(() => {
        if (sleepFadeEnabled && prevSleepFadeDurationMsRef.current !== sleepFadeDurationMs) {
            setSleepFadeStartedAt(Date.now());
        }
        prevSleepFadeDurationMsRef.current = sleepFadeDurationMs;
    }, [sleepFadeDurationMs, sleepFadeEnabled]);

    const internalLoadTrack = useCallback(
        (track: MusicPlaybackTrack, autoPlay = false) => {
            if (currentTrack) {
                stopPlayback({
                    itemId: currentTrack.id,
                    positionTicks: currentTimeRef.current,
                });
            }

            const audio = audioRef.current;
            audio.src = getAudioStreamUrl(track.id);
            audio.currentTime = 0;

            setCurrentTrack(track);
            setCurrentTime(0);
            setDuration(0);

            startPlayback({ itemId: track.id, positionTicks: 0 });

            if (autoPlay) {
                audio.play().catch(console.error);
            }
        },
        [currentTrack, startPlayback, stopPlayback]
    );

    useEffect(() => {
        const audio = audioRef.current;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => {
            const audioDuration = audio.duration;
            let ticks = Math.floor(audio.currentTime * 10_000_000);

            if (Number.isFinite(audioDuration) && audioDuration > 0) {
                const maxTicks = Math.floor(audioDuration * 10_000_000);
                ticks = Math.min(Math.max(0, ticks), maxTicks);
            } else {
                ticks = Math.max(0, ticks);
            }

            setCurrentTime(ticks);
        };
        const onLoaded = () => {
            if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
                setDuration(0);
                return;
            }

            setDuration(Math.floor(audio.duration * 10_000_000));
        };

        const onEnded = () => {
            if (repeat) {
                audio.currentTime = 0;
                audio.play();
                return;
            }

            const nextIndex = currentIndexRef.current + 1;
            if (nextIndex < queueRef.current.length) {
                setCurrentIndex(nextIndex);
                internalLoadTrack(queueRef.current[nextIndex], true);
                return;
            }

            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                setCurrentTime(Math.floor(audio.duration * 10_000_000));
            }
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
        };
    }, [repeat, internalLoadTrack]);

    useEffect(() => {
        if (!currentTrack || !isPlaying) return;

        progressIntervalRef.current = setInterval(() => {
            reportProgress({
                itemId: currentTrack.id,
                positionTicks: currentTimeRef.current,
                isPaused: false,
            });
        }, 10_000);

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };
    }, [currentTrack, isPlaying, reportProgress]);

    const play = useCallback(async () => {
        await resumeContext();
        await audioRef.current.play();
    }, [resumeContext]);

    const pause = useCallback(() => {
        audioRef.current.pause();
        if (currentTrack) {
            reportProgress({
                itemId: currentTrack.id,
                positionTicks: currentTimeRef.current,
                isPaused: true,
            });
        }
    }, [currentTrack, reportProgress]);

    useEffect(() => {
        pauseRef.current = pause;
    }, [pause]);

    const togglePlayPause = useCallback(() => {
        if (isPlayingRef.current) pause();
        else play();
    }, [play, pause]);

    const seek = useCallback((ticks: number) => {
        const audio = audioRef.current;
        const maxTicks =
            Number.isFinite(audio.duration) && audio.duration > 0
                ? Math.floor(audio.duration * 10_000_000)
                : null;
        const clampedTicks =
            maxTicks !== null ? Math.min(Math.max(0, ticks), maxTicks) : Math.max(0, ticks);

        audio.currentTime = clampedTicks / 10_000_000;
        setCurrentTime(clampedTicks);
    }, []);

    const skipNext = useCallback(() => {
        const next = currentIndexRef.current + 1;
        if (next < queueRef.current.length) {
            setCurrentIndex(next);
            internalLoadTrack(queueRef.current[next], isPlayingRef.current);
        } else if (repeat && queueRef.current.length) {
            setCurrentIndex(0);
            internalLoadTrack(queueRef.current[0], isPlayingRef.current);
        }
    }, [repeat, internalLoadTrack]);

    const skipPrevious = useCallback(() => {
        if (currentTimeRef.current > 30_000_000) {
            audioRef.current.currentTime = 0;
            return;
        }

        const prev = currentIndexRef.current - 1;
        if (prev >= 0) {
            setCurrentIndex(prev);
            internalLoadTrack(queueRef.current[prev], isPlayingRef.current);
        } else if (repeat && queueRef.current.length) {
            const last = queueRef.current.length - 1;
            setCurrentIndex(last);
            internalLoadTrack(queueRef.current[last], isPlayingRef.current);
        }
    }, [repeat, internalLoadTrack]);

    const loadTrack = useCallback(
        (track: MusicPlaybackTrack, autoPlay = false) => {
            internalLoadTrack(track, autoPlay);
        },
        [internalLoadTrack]
    );

    const loadQueue = useCallback(
        (tracks: MusicPlaybackTrack[], startIndex = 0, autoPlay = false) => {
            originalQueueRef.current = [...tracks];

            let finalQueue = tracks;
            let index = startIndex;

            if (shuffle) {
                const start = tracks[startIndex];
                const rest = shuffleArray(tracks.filter((_, i) => i !== startIndex));
                finalQueue = [start, ...rest];
                index = 0;
            }

            setQueue(finalQueue);
            setCurrentIndex(index);
            internalLoadTrack(finalQueue[index], autoPlay);
        },
        [shuffle, shuffleArray, internalLoadTrack]
    );

    const clearPlayback = useCallback(() => {
        if (currentTrack) {
            stopPlayback({
                itemId: currentTrack.id,
                positionTicks: currentTime,
            });
        }

        const audio = audioRef.current;
        audio.pause();
        audio.src = '';

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        setCurrentTrack(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setQueue([]);
        setCurrentIndex(-1);
        originalQueueRef.current = [];
        resetSleepFadeSession();
        setSleepFadeStartedAt(null);
        setSleepFadeEnabled(false);
    }, [currentTrack, currentTime, stopPlayback, resetSleepFadeSession, setSleepFadeEnabled]);

    useMediaSession({
        track: currentTrack,
        isPlaying,
        currentTimeTicks: currentTime,
        durationTicks: duration,
        play,
        pause,
        seek,
        skipNext,
        skipPrevious,
    });

    const value: MusicPlaybackContextType = {
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
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
        shuffle,
        toggleShuffle,
        repeat,
        setRepeat,
        queue,
        setQueue,
        currentIndex,
        play,
        pause,
        togglePlayPause,
        seek,
        skipNext,
        skipPrevious,
        clearPlayback,
        loadTrack,
        loadQueue,
    };

    return <MusicPlaybackContext.Provider value={value}>{children}</MusicPlaybackContext.Provider>;
};
