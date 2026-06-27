import type { MusicPlaybackTrack } from '@/context/MusicPlaybackContext';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { setSafeMediaSessionPositionState } from '@/utils/mediaSessionPosition';
import { useEffect } from 'react';

interface MediaSessionArgs {
    track: MusicPlaybackTrack | null;
    isPlaying: boolean;
    currentTimeTicks: number;
    durationTicks: number;
    play: () => void;
    pause: () => void;
    seek: (ticks: number) => void;
    skipNext: () => void;
    skipPrevious: () => void;
}

const TICKS_PER_SECOND = 10_000_000;

export const useMediaSession = ({
    track,
    isPlaying,
    currentTimeTicks,
    durationTicks,
    play,
    pause,
    seek,
    skipNext,
    skipPrevious,
}: MediaSessionArgs) => {
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const ms = navigator.mediaSession;

        ms.setActionHandler('play', play);
        ms.setActionHandler('pause', pause);
        ms.setActionHandler('previoustrack', skipPrevious);
        ms.setActionHandler('nexttrack', skipNext);

        ms.setActionHandler('seekto', (e) => {
            if (e.seekTime == null) return;

            let ticks = Math.floor(e.seekTime * TICKS_PER_SECOND);
            if (durationTicks > 0) {
                ticks = Math.min(Math.max(0, ticks), durationTicks);
            } else {
                ticks = Math.max(0, ticks);
            }

            seek(ticks);
        });

        ms.setActionHandler('seekbackward', (e) => {
            const offset = e.seekOffset ?? 10;
            seek(Math.max(0, currentTimeTicks - offset * TICKS_PER_SECOND));
        });

        ms.setActionHandler('seekforward', (e) => {
            const offset = e.seekOffset ?? 10;
            const maxTicks =
                durationTicks > 0 ? durationTicks : currentTimeTicks + offset * TICKS_PER_SECOND;
            seek(Math.min(maxTicks, currentTimeTicks + offset * TICKS_PER_SECOND));
        });

        return () => {
            ms.setActionHandler('play', null);
            ms.setActionHandler('pause', null);
            ms.setActionHandler('previoustrack', null);
            ms.setActionHandler('nexttrack', null);
            ms.setActionHandler('seekto', null);
            ms.setActionHandler('seekbackward', null);
            ms.setActionHandler('seekforward', null);
        };
    }, [play, pause, seek, skipNext, skipPrevious, currentTimeTicks, durationTicks]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const ms = navigator.mediaSession;

        if (!track) {
            ms.metadata = null;
            return;
        }

        ms.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: track.albumName,
            artwork: [
                {
                    src: getPrimaryImageUrl(track.albumId, {
                        height: 96,
                        width: 96,
                    }),
                    sizes: '96x96',
                    type: 'image/png',
                },
                {
                    src: getPrimaryImageUrl(track.albumId, {
                        height: 192,
                        width: 192,
                    }),
                    sizes: '192x192',
                    type: 'image/png',
                },
                {
                    src: getPrimaryImageUrl(track.albumId, {
                        height: 512,
                        width: 512,
                    }),
                    sizes: '512x512',
                    type: 'image/png',
                },
            ],
        });
    }, [track]);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }, [isPlaying]);

    useEffect(() => {
        if (!track || !durationTicks) return;

        setSafeMediaSessionPositionState(currentTimeTicks, durationTicks);
    }, [track, currentTimeTicks, durationTicks]);
};
