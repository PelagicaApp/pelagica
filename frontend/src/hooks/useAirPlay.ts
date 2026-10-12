import { useCallback, useEffect, useRef, useState } from 'react';

type VideoJsPlayer = ReturnType<typeof import('video.js').default>;

interface AirPlayVideoElement extends HTMLVideoElement {
    webkitShowPlaybackTargetPicker: () => void;
    webkitCurrentPlaybackTargetIsWireless: boolean;
}

interface PlaybackTargetAvailabilityEvent extends Event {
    availability: 'available' | 'not-available';
}

function supportsAirPlay(video: HTMLVideoElement | null): video is AirPlayVideoElement {
    return (
        !!video &&
        typeof (video as AirPlayVideoElement).webkitShowPlaybackTargetPicker === 'function'
    );
}

export interface AirPlayState {
    isAvailable: boolean;
    isActive: boolean;
    showPicker: () => void;
}

export const useAirPlay = (
    player: VideoJsPlayer | null,
    onRouteChange?: (isWireless: boolean) => void
): AirPlayState => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const videoRef = useRef<AirPlayVideoElement | null>(null);
    const onRouteChangeRef = useRef(onRouteChange);

    useEffect(() => {
        onRouteChangeRef.current = onRouteChange;
    }, [onRouteChange]);

    useEffect(() => {
        const video = player?.el()?.querySelector('video') ?? null;

        if (!supportsAirPlay(video)) return;

        videoRef.current = video;

        const handleAvailabilityChange = (event: Event) => {
            setIsAvailable((event as PlaybackTargetAvailabilityEvent).availability === 'available');
        };
        const handleTargetChange = () => {
            const isWireless = video.webkitCurrentPlaybackTargetIsWireless;
            // Runs before React re-renders, so listeners still see the pre-swap position.
            onRouteChangeRef.current?.(isWireless);
            setIsActive(isWireless);
        };

        video.addEventListener('webkitplaybacktargetavailabilitychanged', handleAvailabilityChange);
        video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleTargetChange);
        setIsActive(video.webkitCurrentPlaybackTargetIsWireless);

        return () => {
            video.removeEventListener(
                'webkitplaybacktargetavailabilitychanged',
                handleAvailabilityChange
            );
            video.removeEventListener(
                'webkitcurrentplaybacktargetiswirelesschanged',
                handleTargetChange
            );
            videoRef.current = null;
        };
    }, [player]);

    const showPicker = useCallback(() => {
        videoRef.current?.webkitShowPlaybackTargetPicker();
    }, []);

    return { isAvailable, isActive, showPicker };
};
