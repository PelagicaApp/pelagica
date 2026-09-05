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

export const useAirPlay = (player: VideoJsPlayer | null): AirPlayState => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const videoRef = useRef<AirPlayVideoElement | null>(null);

    useEffect(() => {
        const video = player?.el()?.querySelector('video') ?? null;

        if (!supportsAirPlay(video)) return;

        videoRef.current = video;

        const handleAvailabilityChange = (event: Event) => {
            setIsAvailable((event as PlaybackTargetAvailabilityEvent).availability === 'available');
        };
        const handleTargetChange = () => {
            setIsActive(video.webkitCurrentPlaybackTargetIsWireless);
        };

        video.addEventListener('webkitplaybacktargetavailabilitychanged', handleAvailabilityChange);
        video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', handleTargetChange);
        handleTargetChange();

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
