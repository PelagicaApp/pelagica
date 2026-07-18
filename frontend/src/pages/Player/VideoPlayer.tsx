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
    isAudioSwitchRef: React.MutableRefObject<boolean>;
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
    isAudioSwitchRef,
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
                nativeControlsForTouch: true,
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

        let seekTo: number | null = null;

        if (isAudioSwitchRef.current) {
            seekTo = player.currentTime() || null;
            isAudioSwitchRef.current = false;
        }

        player.pause();
        player.src({ src, type: srcType });
        player.load();

        if (seekTo !== null) {
            player.currentTime(seekTo);
        }

        player.play()?.catch(console.error);
    }, [src, srcType, isAudioSwitchRef]);

    useEffect(() => {
        if (!playerRef.current) return;

        const player = playerRef.current;

        const addSubtitles = (activeIndex: number | null) => {
            const tracks = player.remoteTextTracks();
            while (tracks.tracks_.length > 0) {
                const track = tracks.tracks_[0];
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
            >
                <track kind="captions" srcLang="en" label="English" />
            </video>
        </div>
    );
};

export default VideoPlayer;
