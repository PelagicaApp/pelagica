import { Button } from '@/components/ui/button';
import { useLocalTrailers } from '@pelagica/core';
import { getDirectStreamUrl } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { CirclePlay, CircleStop, Volume2, VolumeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MediaBarTrailerVideoProps {
    item: BaseItemDto;
    active: boolean;
    playing: boolean;
    muted: boolean;
    onMutedChange: (muted: boolean) => void;
    onCanPlayChange: (canPlay: boolean) => void;
}

export const MediaBarTrailerVideo = ({
    item,
    active,
    playing,
    muted,
    onMutedChange,
    onCanPlayChange,
}: MediaBarTrailerVideoProps) => {
    const hasLocalTrailers = (item.LocalTrailerCount ?? 0) > 0;
    const { data: localTrailers } = useLocalTrailers(item.Id ?? undefined, hasLocalTrailers);
    const firstTrailer = localTrailers?.[0];
    const videoRef = useRef<HTMLVideoElement>(null);
    const [canPlay, setCanPlay] = useState(false);

    const trailerUrl = firstTrailer?.Id
        ? getDirectStreamUrl(firstTrailer.Id, { mediaSourceId: firstTrailer.Id })
        : null;

    useEffect(() => {
        onCanPlayChange(canPlay && !!trailerUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canPlay, trailerUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (active && playing && canPlay) {
            video.muted = muted;
            video.play().catch(() => {
                if (!video.muted) {
                    video.muted = true;
                    onMutedChange(true);
                    video.play().catch(() => {});
                }
            });
        } else {
            video.pause();
        }
    }, [active, playing, canPlay, muted, onMutedChange]);

    const visible = active && playing && canPlay;

    if (!trailerUrl) return null;

    return (
        <video
            ref={videoRef}
            src={trailerUrl}
            muted={muted}
            loop
            playsInline
            onCanPlay={() => setCanPlay(true)}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: visible ? 1 : 0 }}
        />
    );
};

interface MediaBarTrailerControlsProps {
    playing: boolean;
    muted: boolean;
    onPlayingChange: (playing: boolean) => void;
    onMutedChange: (muted: boolean) => void;
}

export const MediaBarTrailerControls = ({
    playing,
    muted,
    onPlayingChange,
    onMutedChange,
}: MediaBarTrailerControlsProps) => {
    return (
        <>
            <Button variant="outline" size="icon-lg" onClick={() => onPlayingChange(!playing)}>
                {playing ? <CircleStop /> : <CirclePlay />}
            </Button>
            {playing && (
                <Button variant="outline" size="icon-lg" onClick={() => onMutedChange(!muted)}>
                    {muted ? <VolumeOff /> : <Volume2 />}
                </Button>
            )}
        </>
    );
};
