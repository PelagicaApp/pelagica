import '../navigation/tizen-globals.d.ts';
import type { TvPlayer, TvPlayerEventName } from './types';

type Handler = () => void;

export class AvPlayPlayerAdapter implements TvPlayer {
    private readonly avplay: AVPlayObject;
    private paused = true;
    private disposed = false;
    private duration = 0;
    private bufferedEnd = 0;
    private readonly listeners: Record<TvPlayerEventName, Set<Handler>> = {
        play: new Set(),
        pause: new Set(),
        timeupdate: new Set(),
        loadedmetadata: new Set(),
        progress: new Set(),
        volumechange: new Set(),
        ended: new Set(),
    };

    constructor(avplay: AVPlayObject) {
        this.avplay = avplay;
    }

    notifyPrepared(durationMs: number) {
        this.duration = durationMs / 1000;
        this.emit('loadedmetadata');
    }

    notifyCurrentTime(currentTimeMs: number) {
        this.bufferedEnd = Math.max(this.bufferedEnd, currentTimeMs / 1000);
        this.emit('timeupdate');
    }

    notifyBufferingProgress(percent: number) {
        if (this.duration > 0) {
            this.bufferedEnd = Math.max(this.bufferedEnd, this.duration * (percent / 100));
        }
        this.emit('progress');
    }

    notifyEnded() {
        this.paused = true;
        this.emit('ended');
    }

    dispose() {
        this.disposed = true;
    }

    play() {
        try {
            this.avplay.play();
            this.paused = false;
            this.emit('play');
        } catch (error) {
            console.error('AVPlay play() failed:', error);
        }
    }

    pause() {
        try {
            this.avplay.pause();
            this.paused = true;
            this.emit('pause');
        } catch (error) {
            console.error('AVPlay pause() failed:', error);
        }
    }

    isPaused() {
        return this.paused;
    }

    isDisposed() {
        return this.disposed;
    }

    getCurrentTime() {
        try {
            return this.avplay.getCurrentTime() / 1000;
        } catch {
            return 0;
        }
    }

    seekTo(seconds: number) {
        try {
            this.avplay.seekTo(Math.max(0, Math.round(seconds * 1000)));
        } catch (error) {
            console.error('AVPlay seekTo() failed:', error);
        }
    }

    getDuration() {
        return this.duration;
    }

    getBufferedEnd() {
        return this.bufferedEnd;
    }

    isMuted() {
        try {
            return window.tizen?.tvaudiocontrol?.isMute() ?? false;
        } catch {
            return false;
        }
    }

    setMuted(muted: boolean) {
        try {
            window.tizen?.tvaudiocontrol?.setMute(muted);
        } catch (error) {
            console.error('Failed to set TV mute state:', error);
        }
        this.emit('volumechange');
    }

    getVolume() {
        try {
            const volume = window.tizen?.tvaudiocontrol?.getVolume();
            return volume !== undefined ? volume / 100 : 1;
        } catch {
            return 1;
        }
    }

    on(event: TvPlayerEventName, handler: Handler) {
        this.listeners[event].add(handler);
    }

    off(event: TvPlayerEventName, handler: Handler) {
        this.listeners[event].delete(handler);
    }

    private emit(event: TvPlayerEventName) {
        if (this.disposed) return;
        this.listeners[event].forEach((handler) => handler());
    }
}

export function createAvPlayPlayerAdapter(avplay: AVPlayObject): AvPlayPlayerAdapter {
    return new AvPlayPlayerAdapter(avplay);
}
