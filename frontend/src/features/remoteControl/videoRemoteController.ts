import { useEffect, useRef } from 'react';

export interface VideoRemoteController {
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    stop: () => void;
    seek: (ticks: number) => void;
    seekBy: (seconds: number) => void;
    next: () => void;
    previous: () => void;
    /** Volume from 0 to 100 */
    getVolume: () => number;
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean | 'toggle') => void;
    /** Index of the audio stream in the item's MediaStreams */
    setAudioStreamIndex: (index: number) => void;
    /** Index of the subtitle stream in the item's MediaStreams, or -1 to turn subtitles off */
    setSubtitleStreamIndex: (index: number) => void;
    toggleFullscreen: () => void;
}

let activeController: VideoRemoteController | null = null;

export function getActiveVideoController(): VideoRemoteController | null {
    return activeController;
}

export function useVideoRemoteController(controller: VideoRemoteController) {
    const controllerRef = useRef(controller);

    useEffect(() => {
        controllerRef.current = controller;
    });

    useEffect(() => {
        const proxy: VideoRemoteController = {
            play: () => controllerRef.current.play(),
            pause: () => controllerRef.current.pause(),
            togglePlayPause: () => controllerRef.current.togglePlayPause(),
            stop: () => controllerRef.current.stop(),
            seek: (ticks) => controllerRef.current.seek(ticks),
            seekBy: (seconds) => controllerRef.current.seekBy(seconds),
            next: () => controllerRef.current.next(),
            previous: () => controllerRef.current.previous(),
            getVolume: () => controllerRef.current.getVolume(),
            setVolume: (volume) => controllerRef.current.setVolume(volume),
            setMuted: (muted) => controllerRef.current.setMuted(muted),
            setAudioStreamIndex: (index) => controllerRef.current.setAudioStreamIndex(index),
            setSubtitleStreamIndex: (index) => controllerRef.current.setSubtitleStreamIndex(index),
            toggleFullscreen: () => controllerRef.current.toggleFullscreen(),
        };

        activeController = proxy;
        return () => {
            if (activeController === proxy) activeController = null;
        };
    }, []);
}
