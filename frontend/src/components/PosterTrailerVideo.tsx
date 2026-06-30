import { useLocalTrailers } from '@/hooks/api/useLocalTrailers';
import { getDirectStreamUrl } from '@/utils/jellyfinUrls';
import { Volume2, VolumeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PosterTrailerVideoProps {
    itemId: string;
    hovered: boolean;
    roundedClass: string;
}

const HOVER_DELAY_MS = 500;

const PosterTrailerVideo = ({ itemId, hovered, roundedClass }: PosterTrailerVideoProps) => {
    const { data: localTrailers } = useLocalTrailers(itemId, hovered);
    const firstTrailer = localTrailers?.[0];
    const videoRef = useRef<HTMLVideoElement>(null);
    const [canPlay, setCanPlay] = useState(false);
    const [shouldPlay, setShouldPlay] = useState(false);
    const [muted, setMuted] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const trailerUrl = firstTrailer?.Id
        ? getDirectStreamUrl(firstTrailer.Id, { mediaSourceId: firstTrailer.Id })
        : null;

    useEffect(() => {
        if (hovered) {
            timerRef.current = setTimeout(() => setShouldPlay(true), HOVER_DELAY_MS);
        } else {
            if (timerRef.current) clearTimeout(timerRef.current);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShouldPlay(false);
            setCanPlay(false);
            setMuted(true);
            const video = videoRef.current;
            if (video) {
                video.pause();
                video.removeAttribute('src');
                video.load();
            }
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [hovered]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (shouldPlay && canPlay) {
            video.muted = muted;
            video.play().catch(() => {
                if (!video.muted) {
                    video.muted = true;
                    setMuted(true);
                    video.play().catch(() => {});
                }
            });
        } else if (!shouldPlay) {
            video.pause();
        }
    }, [shouldPlay, canPlay, muted]);

    const visible = shouldPlay && canPlay;

    if (!shouldPlay || !trailerUrl) return null;

    const MuteIcon = muted ? VolumeOff : Volume2;

    return (
        <>
            <video
                ref={videoRef}
                src={trailerUrl}
                muted={muted}
                loop
                playsInline
                onCanPlay={() => setCanPlay(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-15 ${roundedClass}`}
                style={{ opacity: visible ? 1 : 0 }}
            />
            {visible && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMuted((m) => !m);
                    }}
                    className="absolute bottom-2 right-2 z-20 bg-black/60 hover:bg-black/80 rounded-full p-1.5 transition-colors"
                >
                    <MuteIcon className="w-4 h-4 text-white" />
                </button>
            )}
        </>
    );
};

export default PosterTrailerVideo;
