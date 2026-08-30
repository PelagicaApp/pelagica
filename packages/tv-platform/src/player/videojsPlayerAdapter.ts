import type videojs from 'video.js';
import type { TvPlayer, TvPlayerEventName } from './types';

type VideoJsPlayer = ReturnType<typeof videojs>;

export function createVideoJsPlayerAdapter(player: VideoJsPlayer): TvPlayer {
    return {
        play() {
            player.play()?.catch(console.error);
        },
        pause() {
            player.pause();
        },
        isPaused() {
            return player.paused();
        },
        isDisposed() {
            return player.isDisposed?.() ?? false;
        },
        getCurrentTime() {
            return player.currentTime() || 0;
        },
        seekTo(seconds) {
            player.currentTime(seconds);
        },
        getDuration() {
            return player.duration() || 0;
        },
        getBufferedEnd() {
            const buffered = player.buffered();
            return buffered && buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
        },
        isMuted() {
            return player.muted() || false;
        },
        setMuted(muted) {
            player.muted(muted);
        },
        getVolume() {
            return player.volume() ?? 1;
        },
        on(event: TvPlayerEventName, handler: () => void) {
            player.on(event, handler);
        },
        off(event: TvPlayerEventName, handler: () => void) {
            player.off(event, handler);
        },
    };
}
