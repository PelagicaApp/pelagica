import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import JASSUB from 'jassub';
import { Loader2 } from 'lucide-react';
import { createVideoJsPlayerAdapter } from '@pelagica/tv-platform';
import type { VideoPlayerProps } from './types';

type VideoJsPlayer = ReturnType<typeof videojs>;

const STALL_TIMEOUT_MS = 20_000;

function isJassubSupported() {
    return (
        typeof WebAssembly !== 'undefined' &&
        typeof Worker !== 'undefined' &&
        typeof HTMLCanvasElement !== 'undefined' &&
        'transferControlToOffscreen' in HTMLCanvasElement.prototype
    );
}

const VideoPlayer = ({
    src,
    srcType = 'application/x-mpegURL',
    startTicks,
    subtitles,
    subtitleFonts,
    onReady,
    onPlaybackError,
    onPlaybackStalled,
    pendingAudioSwitchSeekRef,
    subtitleTrackIndex,
}: VideoPlayerProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<VideoJsPlayer | null>(null);
    const hasSeekedRef = useRef(false);
    const assRendererRef = useRef<JASSUB | null>(null);
    const onPlaybackErrorRef = useRef(onPlaybackError);
    const onPlaybackStalledRef = useRef(onPlaybackStalled);
    const stallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isBuffering, setIsBuffering] = useState(true);

    useEffect(() => {
        onPlaybackErrorRef.current = onPlaybackError;
    }, [onPlaybackError]);

    useEffect(() => {
        onPlaybackStalledRef.current = onPlaybackStalled;
    }, [onPlaybackStalled]);

    useEffect(() => {
        if (!containerRef.current) return;

        const videoEl = document.createElement('video');
        videoEl.className = 'video-js vjs-default-skin';
        videoEl.setAttribute('data-testid', 'video-player');
        videoEl.style.maxWidth = '100%';
        videoEl.style.maxHeight = '100%';
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        containerRef.current.appendChild(videoEl);
        videoRef.current = videoEl;

        const player = videojs(videoEl, {
            controls: false,
            autoplay: false,
            preload: 'auto',
            responsive: false,
            fluid: false,
            html5: {
                nativeControlsForTouch: false,
                hls: { overrideNative: true },
                nativeTextTracks: false, // Force video.js to render text tracks
            },
        });

        playerRef.current = player;

        player.on('error', () => {
            const mediaError = player.error() as unknown as MediaError | null;
            console.error('video.js playback error:', mediaError);
            setIsBuffering(false);
            onPlaybackErrorRef.current?.(mediaError);
        });

        player.on('waiting', () => setIsBuffering(true));
        player.on('playing', () => setIsBuffering(false));

        player.ready(() => {
            onReady?.(createVideoJsPlayerAdapter(player));
        });

        return () => {
            assRendererRef.current?.destroy();
            assRendererRef.current = null;
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
            videoRef.current = null;
        };
    }, [onReady]);

    useEffect(() => {
        if (!playerRef.current) return;
        if (!startTicks || startTicks <= 0) return;
        if (hasSeekedRef.current) return;

        const seconds = startTicks / 10_000_000;

        playerRef.current.currentTime(seconds);
        hasSeekedRef.current = true;
    }, [startTicks]);

    useEffect(() => {
        hasSeekedRef.current = false;
    }, [src]);

    useEffect(() => {
        if (!playerRef.current || !src) return;

        const player = playerRef.current;

        setIsBuffering(true);

        let seekTo: number | null = null;

        if (pendingAudioSwitchSeekRef.current !== null) {
            seekTo = pendingAudioSwitchSeekRef.current;
            pendingAudioSwitchSeekRef.current = null;
        }

        player.pause();
        player.src({ src, type: srcType });
        player.load();

        if (seekTo !== null) {
            player.currentTime(seekTo);
        }

        const clearStallTimeout = () => {
            if (stallTimeoutRef.current) {
                clearTimeout(stallTimeoutRef.current);
                stallTimeoutRef.current = null;
            }
        };

        clearStallTimeout();
        stallTimeoutRef.current = setTimeout(() => {
            stallTimeoutRef.current = null;
            onPlaybackStalledRef.current?.();
        }, STALL_TIMEOUT_MS);

        player.one(['playing', 'timeupdate'], clearStallTimeout);

        player.play()?.catch(console.error);

        return () => {
            player.off(['playing', 'timeupdate'], clearStallTimeout);
            clearStallTimeout();
        };
    }, [src, srcType, pendingAudioSwitchSeekRef]);

    useEffect(() => {
        if (!playerRef.current) return;

        const player = playerRef.current;

        const addSubtitles = (activeIndex: number | null) => {
            const tracks = player.remoteTextTracks();
            for (let i = tracks.tracks_.length - 1; i >= 0; i--) {
                const track = tracks.tracks_[i];
                if (track) player.removeRemoteTextTrack(track);
            }

            if (subtitles && subtitles.length > 0) {
                let addedCount = 0;
                subtitles.forEach((subtitle, index) => {
                    // ASS/SSA tracks are rendered by JASSUB instead of the native text track
                    if (subtitle.format === 'ass') return;

                    player.addRemoteTextTrack(
                        {
                            kind: 'subtitles',
                            src: subtitle.src,
                            srclang: subtitle.srclang,
                            label: subtitle.label,
                            default: subtitle.default,
                        },
                        false // Don't add to DOM manually
                    );

                    const addedTrack = player.remoteTextTracks().tracks_[addedCount];
                    addedCount++;
                    if (addedTrack) {
                        addedTrack.mode = index === activeIndex ? 'showing' : 'disabled';
                    }
                });
            }
        };

        addSubtitles(subtitleTrackIndex);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                addSubtitles(subtitleTrackIndex);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [subtitles, src, subtitleTrackIndex]);

    useEffect(() => {
        if (!playerRef.current) return;

        const videoEl = playerRef.current.el()?.querySelector('video');
        if (!videoEl) return;

        const activeTrack =
            subtitleTrackIndex !== null ? (subtitles?.[subtitleTrackIndex] ?? null) : null;

        if (!assRendererRef.current) {
            if (!activeTrack || activeTrack.format !== 'ass') return;

            if (!isJassubSupported()) {
                console.error(
                    'ASS subtitles unsupported on this device (missing WebAssembly, module Worker, or OffscreenCanvas support)'
                );
                return;
            }

            try {
                const renderer = new JASSUB({
                    video: videoEl,
                    subUrl: activeTrack.src,
                    fonts: subtitleFonts,
                });
                assRendererRef.current = renderer;
                renderer.ready.catch((error) =>
                    console.error('Error initializing ASS subtitle renderer:', error)
                );
            } catch (error) {
                console.error('Failed to create ASS subtitle renderer:', error);
            }
            return;
        }

        const renderer = assRendererRef.current;
        renderer.ready
            .then(() => {
                // Bail out if the renderer was replaced/destroyed while we were waiting
                if (assRendererRef.current !== renderer) return;

                if (!activeTrack || activeTrack.format !== 'ass') {
                    renderer.renderer.freeTrack();
                } else {
                    renderer.renderer.setTrackByUrl(activeTrack.src);
                }
            })
            .catch((error) => console.error('Error updating ASS subtitles:', error));
    }, [subtitleTrackIndex, subtitles, subtitleFonts]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div
                ref={containerRef}
                className="w-full h-full overflow-hidden"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
