import { useLocalTrailers } from '@/hooks/api/useLocalTrailers';
import { getDirectStreamUrl } from '@/utils/jellyfinUrls';
import { Maximize, Minimize, Volume2, VolumeOff } from 'lucide-react';
import { useEffect, useState, type RefObject } from 'react';

const START_DELAY_MS = 3000;

interface ItemBackdropTrailerVideoProps {
    itemId: string;
    enabled: boolean;
    videoRef: RefObject<HTMLVideoElement | null>;
    muted: boolean;
    isFullscreen: boolean;
    onReadyChange: (ready: boolean) => void;
}

export const ItemBackdropTrailerVideo = ({
    itemId,
    enabled,
    videoRef,
    muted,
    isFullscreen,
    onReadyChange,
}: ItemBackdropTrailerVideoProps) => {
    const { data: localTrailers } = useLocalTrailers(itemId, enabled);
    const firstTrailer = localTrailers?.[0];
    const [canPlay, setCanPlay] = useState(false);
    const [shouldPlay, setShouldPlay] = useState(false);

    const trailerUrl = firstTrailer?.Id
        ? getDirectStreamUrl(firstTrailer.Id, { mediaSourceId: firstTrailer.Id })
        : null;

    useEffect(() => {
        if (!enabled || !trailerUrl) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldPlay(false);
            return;
        }
        const timer = setTimeout(() => setShouldPlay(true), START_DELAY_MS);
        return () => clearTimeout(timer);
    }, [enabled, trailerUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !shouldPlay) return;

        video.muted = muted;
        video.play().catch(() => {
            if (!video.muted) {
                video.muted = true;
                video.play().catch(() => {});
            }
        });
    }, [shouldPlay, muted, videoRef]);

    useEffect(() => {
        onReadyChange(canPlay && shouldPlay && !!trailerUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canPlay, shouldPlay, trailerUrl]);

    if (!enabled || !trailerUrl || !shouldPlay) return null;

    return (
        <video
            ref={videoRef}
            src={trailerUrl}
            muted={muted}
            controls={isFullscreen}
            loop
            autoPlay
            playsInline
            onCanPlay={() => setCanPlay(true)}
            className={[
                'absolute inset-0 h-full w-full transition-opacity duration-700',
                isFullscreen ? 'object-contain' : 'object-cover',
            ].join(' ')}
            style={{ opacity: canPlay ? 1 : 0 }}
        />
    );
};

interface ItemBackdropTrailerControlsProps {
    muted: boolean;
    onMutedChange: (muted: boolean) => void;
    isFullscreen: boolean;
    onFullscreenToggle: () => void;
}

export const ItemBackdropTrailerControls = ({
    muted,
    onMutedChange,
    isFullscreen,
    onFullscreenToggle,
}: ItemBackdropTrailerControlsProps) => {
    const MuteIcon = muted ? VolumeOff : Volume2;
    const FullscreenIcon = isFullscreen ? Minimize : Maximize;

    return (
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
            <button
                type="button"
                onClick={() => onMutedChange(!muted)}
                className="bg-black/60 hover:bg-black/80 rounded-full p-2 transition-colors"
            >
                <MuteIcon className="w-4 h-4 text-white" />
            </button>
            <button
                type="button"
                onClick={onFullscreenToggle}
                className="bg-black/60 hover:bg-black/80 rounded-full p-2 transition-colors"
            >
                <FullscreenIcon className="w-4 h-4 text-white" />
            </button>
        </div>
    );
};
