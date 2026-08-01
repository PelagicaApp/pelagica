import { createContext } from 'react';
import type {
    CustomEqualizerPreset,
    EqualizerBand,
    EqualizerSelection,
} from '@/features/equalizer/presets';

export interface MusicPlaybackTrack {
    id: string;
    title: string;
    artist: string;
    albumId: string;
    albumName: string;
}

export interface MusicPlaybackContextType {
    currentTrack: MusicPlaybackTrack | null;
    setCurrentTrack: (track: MusicPlaybackTrack | null) => void;

    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;

    currentTime: number;
    setCurrentTime: (time: number) => void;
    duration: number;
    setDuration: (duration: number) => void;

    volume: number;
    setVolume: (volume: number) => void;
    equalizerPreset: EqualizerSelection;
    setEqualizerPreset: (preset: EqualizerSelection) => void;
    customEqualizerPresets: CustomEqualizerPreset[];
    saveCustomEqualizerPreset: (preset: CustomEqualizerPreset) => void;
    deleteCustomEqualizerPreset: (id: string) => void;
    setEqualizerPreviewBands: (bands: EqualizerBand[] | null) => void;
    sleepFadeEnabled: boolean;
    startSleepFade: (minutes: number) => void;
    stopSleepFade: () => void;
    sleepFadeDurationMinutes: number;
    sleepFadeStartedAt: number | null;
    equalizerAvailable: boolean;
    shuffle: boolean;
    toggleShuffle: () => void;
    repeat: boolean;
    setRepeat: (repeat: boolean) => void;

    queue: MusicPlaybackTrack[];
    setQueue: (queue: MusicPlaybackTrack[]) => void;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;

    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    skipNext: () => void;
    skipPrevious: () => void;
    clearPlayback: () => void;
    loadTrack: (track: MusicPlaybackTrack, autoPlay?: boolean) => void;
    loadQueue: (tracks: MusicPlaybackTrack[], startIndex?: number, autoPlay?: boolean) => void;
    loadQueueShuffled: (tracks: MusicPlaybackTrack[], autoPlay?: boolean) => void;
    addToQueueStart: (tracks: MusicPlaybackTrack[]) => void;
    addToQueueEnd: (tracks: MusicPlaybackTrack[]) => void;
}

export const MusicPlaybackContext = createContext<MusicPlaybackContextType | undefined>(undefined);
