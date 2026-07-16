import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import {
    init,
    destroy,
    command,
    setProperty,
    observeProperties,
    setVideoMarginRatio,
    type MpvObservableProperty,
    type VideoMarginRatio,
} from 'tauri-plugin-libmpv-api';

const OBSERVED_PROPERTIES = [
    ['pause', 'flag'],
    ['time-pos', 'double', 'none'],
    ['duration', 'double', 'none'],
    ['volume', 'double'],
    ['mute', 'flag'],
] as const satisfies MpvObservableProperty[];

const formatTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

interface MpvVideoPlayerProps {
    src: string;
    title?: string;
    startTicks?: number;
}

const MpvVideoPlayer = ({ src, title, startTicks = 0 }: MpvVideoPlayerProps) => {
    const navigate = useNavigate();
    const videoRectRef = useRef<HTMLDivElement>(null);
    const prevRatioRef = useRef<VideoMarginRatio>({ left: 0, right: 0, top: 0, bottom: 0 });
    const hasSeekedRef = useRef(false);

    const [isInitialized, setIsInitialized] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [timePos, setTimePos] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            await destroy().catch(() => {});

            try {
                await init({
                    initialOptions: {
                        vo: 'gpu-next',
                        hwdec: 'auto-safe',
                        'keep-open': 'yes',
                        'force-window': 'yes',
                    },
                    observedProperties: OBSERVED_PROPERTIES,
                });
                if (!cancelled) setIsInitialized(true);
            } catch (error) {
                console.error('mpv initialization failed:', error);
            }
        })();

        return () => {
            cancelled = true;
            destroy().catch(() => {});
        };
    }, []);

    useEffect(() => {
        const unlistenPromise = observeProperties(OBSERVED_PROPERTIES, ({ name, data }) => {
            switch (name) {
                case 'pause':
                    setIsPaused(data);
                    break;
                case 'time-pos':
                    setTimePos(data ?? 0);
                    break;
                case 'duration':
                    setDuration(data ?? 0);
                    break;
                case 'volume':
                    setVolume(data);
                    break;
                case 'mute':
                    setIsMuted(data);
                    break;
            }
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    useEffect(() => {
        if (!isInitialized || !src) return;
        hasSeekedRef.current = false;
        command('loadfile', [src]).catch(console.error);
    }, [isInitialized, src]);

    useEffect(() => {
        if (hasSeekedRef.current) return;
        if (!startTicks || startTicks <= 0) return;
        if (!duration) return;

        hasSeekedRef.current = true;
        command('seek', [startTicks / 10_000_000, 'absolute']).catch(console.error);
    }, [duration, startTicks]);

    useEffect(() => {
        const videoRect = videoRectRef.current;
        if (!videoRect || !isInitialized) return;

        const updateRatio = async () => {
            const rect = videoRect.getBoundingClientRect();

            const left = Math.round(rect.left) / window.innerWidth;
            const right = 1 - Math.round(rect.right) / window.innerWidth;
            const top = Math.round(rect.top) / window.innerHeight;
            const bottom = 1 - Math.round(rect.bottom) / window.innerHeight;

            const changed: VideoMarginRatio = {};
            if (left !== prevRatioRef.current.left) changed.left = left;
            if (right !== prevRatioRef.current.right) changed.right = right;
            if (top !== prevRatioRef.current.top) changed.top = top;
            if (bottom !== prevRatioRef.current.bottom) changed.bottom = bottom;

            if (Object.keys(changed).length > 0) {
                await setVideoMarginRatio(changed);
            }

            prevRatioRef.current = { left, right, top, bottom };
        };

        const throttled = () => window.requestAnimationFrame(updateRatio);
        const resizeObserver = new ResizeObserver(throttled);
        resizeObserver.observe(videoRect);
        throttled();

        return () => resizeObserver.disconnect();
    }, [isInitialized]);

    useEffect(() => {
        const { body } = document;
        const previousBackground = body.style.background;
        body.style.background = 'transparent';
        return () => {
            body.style.background = previousBackground;
        };
    }, []);

    const togglePlay = () => {
        if (!isInitialized) return;
        setProperty('pause', !isPaused).catch(console.error);
    };
    const toggleMute = () => {
        if (!isInitialized) return;
        setProperty('mute', !isMuted).catch(console.error);
    };
    const handleSeek = (value: number) => {
        if (!isInitialized) return;
        command('seek', [value, 'absolute']).catch(console.error);
    };
    const handleVolume = (value: number) => {
        if (!isInitialized) return;
        setProperty('volume', value).catch(console.error);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <div ref={videoRectRef} className="absolute inset-0" />

            <div className="absolute top-0 left-0 right-0 flex items-center gap-3 p-4 bg-linear-to-b from-black/70 to-transparent">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white hover:text-white/70 transition-colors"
                >
                    <ArrowLeft />
                </button>
                {title && <span className="text-white text-sm font-medium truncate">{title}</span>}
            </div>

            <div
                className={`absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-4 bg-linear-to-t from-black/70 to-transparent ${!isInitialized ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={timePos}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full"
                    disabled={!isInitialized}
                />
                <div className="flex items-center gap-3 text-white">
                    <button
                        onClick={togglePlay}
                        disabled={!isInitialized}
                        className="hover:text-white/70 transition-colors"
                    >
                        {isPaused ? <Play /> : <Pause />}
                    </button>
                    <button
                        onClick={toggleMute}
                        disabled={!isInitialized}
                        className="hover:text-white/70 transition-colors"
                    >
                        {isMuted ? <VolumeX /> : <Volume2 />}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={volume}
                        onChange={(e) => handleVolume(Number(e.target.value))}
                        className="w-24"
                        disabled={!isInitialized}
                    />
                    <span className="text-xs tabular-nums ml-auto">
                        {formatTime(timePos)} / {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MpvVideoPlayer;
