import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import JASSUB from 'jassub';

type VideoJsPlayer = ReturnType<typeof videojs>;

export interface SubtitleTrack {
    src: string;
    srclang: string;
    label: string;
    default?: boolean;
    format?: 'vtt' | 'ass';
}

interface VideoPlayerProps {
    src: string;
    srcType?: string;
    poster?: string;
    startTicks: number;
    subtitles?: SubtitleTrack[];
    subtitleFonts?: string[];
    onReady?: (player: VideoJsPlayer) => void;
    onPlaybackError?: (error: MediaError | null) => void;
    pendingAudioSwitchSeekRef: React.MutableRefObject<number | null>;
    subtitleTrackIndex: number | null;
}

const VideoPlayer = ({
    src,
    srcType = 'application/x-mpegURL',
    poster,
    startTicks,
    subtitles,
    subtitleFonts,
    onReady,
    onPlaybackError,
    pendingAudioSwitchSeekRef,
    subtitleTrackIndex,
}: VideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<VideoJsPlayer | null>(null);
    const hasSeekedRef = useRef(false);
    const assRendererRef = useRef<JASSUB | null>(null);
    const onPlaybackErrorRef = useRef(onPlaybackError);

    useEffect(() => {
        onPlaybackErrorRef.current = onPlaybackError;
    }, [onPlaybackError]);

    useEffect(() => {
        if (!videoRef.current) return;

        const player = videojs(videoRef.current, {
            controls: false,
            autoplay: false,
            preload: 'auto',
            poster: poster,
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
            onPlaybackErrorRef.current?.(mediaError);
        });

        player.ready(() => {
            onReady?.(player);
        });

        return () => {
            assRendererRef.current?.destroy();
            assRendererRef.current = null;
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [onReady, poster]);

    const startTicksRef = useRef(startTicks);

    useEffect(() => {
        startTicksRef.current = startTicks;
    }, [startTicks]);

    useEffect(() => {
        if (!playerRef.current || !src) return;

        const player = playerRef.current;

        let seekTo: number | null = null;

        if (pendingAudioSwitchSeekRef.current !== null) {
            seekTo = pendingAudioSwitchSeekRef.current;
            pendingAudioSwitchSeekRef.current = null;
        } else if (!hasSeekedRef.current && startTicksRef.current > 0) {
            seekTo = startTicksRef.current / 10_000_000;
            hasSeekedRef.current = true;
        }

        player.pause();
        player.src({ src, type: srcType });

        if (seekTo !== null) {
            const target = seekTo;
            const seekOnCanPlay = () => {
                player.currentTime(target);
                player.play()?.catch(console.error);
            };

            player.one('canplay', seekOnCanPlay);

            return () => {
                player.off('canplay', seekOnCanPlay);
            };
        }

        player.play()?.catch(console.error);
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

            assRendererRef.current = new JASSUB({
                video: videoEl,
                subUrl: activeTrack.src,
                fonts: subtitleFonts,
            });
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
        <div
            className="w-full h-full overflow-hidden"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <video
                ref={videoRef}
                className="video-js vjs-default-skin"
                data-testid="video-player"
                style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default VideoPlayer;
