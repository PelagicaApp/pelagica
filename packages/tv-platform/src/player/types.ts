export interface SubtitleTrack {
    src: string;
    srclang: string;
    label: string;
    default?: boolean;
    format?: 'vtt' | 'ass';
}

export type TvPlayerEventName =
    | 'play'
    | 'pause'
    | 'timeupdate'
    | 'loadedmetadata'
    | 'progress'
    | 'volumechange'
    | 'ended';

export interface TvPlayer {
    play(): void;
    pause(): void;
    isPaused(): boolean;
    isDisposed(): boolean;
    getCurrentTime(): number;
    seekTo(seconds: number): void;
    getDuration(): number;
    /** End time (in seconds) of the last buffered range, or 0 if nothing is buffered. */
    getBufferedEnd(): number;
    isMuted(): boolean;
    setMuted(muted: boolean): void;
    getVolume(): number;
    on(event: TvPlayerEventName, handler: () => void): void;
    off(event: TvPlayerEventName, handler: () => void): void;
}
