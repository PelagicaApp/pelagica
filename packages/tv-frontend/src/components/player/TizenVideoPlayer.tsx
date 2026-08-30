import { useCallback, useEffect, useRef, useState } from 'react';
import { AvPlayPlayerAdapter, createAvPlayPlayerAdapter } from '@pelagica/tv-platform';
import { useLayerActive } from '@/router';
import type { VideoPlayerProps } from './types';

const STALL_TIMEOUT_MS = 20_000;

function stripVttMarkup(text: string) {
    return text.replace(/<[^>]+>/g, '');
}

const TizenVideoPlayer = ({
    src,
    startTicks,
    subtitles,
    onReady,
    onPlaybackStalled,
    pendingAudioSwitchSeekRef,
    subtitleTrackIndex,
    audioTrackIndex,
    audioStreams,
}: VideoPlayerProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const subtitleVideoRef = useRef<HTMLVideoElement | null>(null);
    const adapterRef = useRef<AvPlayPlayerAdapter | null>(null);
    const hasSeekedRef = useRef(false);
    const onPlaybackStalledRef = useRef(onPlaybackStalled);
    const stallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioTrackIndexRef = useRef(audioTrackIndex);
    const audioStreamsRef = useRef(audioStreams);
    const [activeCueText, setActiveCueText] = useState('');
    const isLayerActive = useLayerActive();

    useEffect(() => {
        onPlaybackStalledRef.current = onPlaybackStalled;
    }, [onPlaybackStalled]);

    useEffect(() => {
        audioTrackIndexRef.current = audioTrackIndex;
        audioStreamsRef.current = audioStreams;
    }, [audioTrackIndex, audioStreams]);

    const clearStallTimeout = useCallback(() => {
        if (stallTimeoutRef.current) {
            clearTimeout(stallTimeoutRef.current);
            stallTimeoutRef.current = null;
        }
    }, []);

    const armStallTimeout = useCallback(() => {
        clearStallTimeout();
        stallTimeoutRef.current = setTimeout(() => {
            stallTimeoutRef.current = null;
            onPlaybackStalledRef.current?.();
        }, STALL_TIMEOUT_MS);
    }, [clearStallTimeout]);

    // AVPlay hardware video plane is below HTML layer so we punch a hole in the HTML
    useEffect(() => {
        if (!isLayerActive) return;

        const html = document.documentElement;
        const body = document.body;
        const prevHtmlBackground = html.style.background;
        const prevBodyBackground = body.style.background;
        html.style.background = 'transparent';
        body.style.background = 'transparent';

        return () => {
            html.style.background = prevHtmlBackground;
            body.style.background = prevBodyBackground;
        };
    }, [isLayerActive]);

    useEffect(() => {
        const avplay = window.webapis?.avplay;
        if (!avplay) {
            console.error('webapis.avplay is unavailable - is this running on a Tizen device?');
            return;
        }

        const adapter = createAvPlayPlayerAdapter(avplay);
        adapterRef.current = adapter;

        avplay.setListener({
            onbufferingprogress: (percent) => adapter.notifyBufferingProgress(percent),
            onbufferingcomplete: () => clearStallTimeout(),
            oncurrentplaytime: (currentTime) => {
                clearStallTimeout();
                adapter.notifyCurrentTime(currentTime);
            },
            onstreamcompleted: () => {
                adapter.notifyEnded();
                try {
                    avplay.stop();
                } catch (error) {
                    console.error('Error stopping AVPlay after playback completed:', error);
                }
            },
            onerror: (eventType) => {
                console.error('AVPlay error:', eventType);
                onPlaybackStalledRef.current?.();
            },
        });

        onReady?.(adapter);

        return () => {
            clearStallTimeout();
            adapter.dispose();
            adapterRef.current = null;
            try {
                avplay.stop();
            } catch {
                // Nothing was playing
            }
            try {
                avplay.close();
            } catch {
                // Nothing was open
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const avplay = window.webapis?.avplay;
        const adapter = adapterRef.current;
        if (!avplay || !adapter || !src) return;

        let cancelled = false;
        const pendingSeek = pendingAudioSwitchSeekRef.current;
        pendingAudioSwitchSeekRef.current = null;
        const resumeSeconds =
            pendingSeek !== null
                ? pendingSeek
                : !hasSeekedRef.current && startTicks > 0
                  ? startTicks / 10_000_000
                  : null;

        try {
            avplay.stop();
        } catch {
            // Nothing was playing yet
        }
        try {
            avplay.close();
        } catch {
            // Nothing was open yet
        }

        try {
            avplay.open(src);

            try {
                avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);
            } catch (error) {
                console.error('AVPlay setDisplayRect() failed:', error);
            }
            try {
                avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');
            } catch (error) {
                console.error('AVPlay setDisplayMethod() failed:', error);
            }

            armStallTimeout();

            avplay.prepareAsync(
                () => {
                    if (cancelled) return;
                    adapter.notifyPrepared(avplay.getDuration());
                    hasSeekedRef.current = true;

                    // setSelectTrack('AUDIO', ...) is only valid once actually PLAYING
                    const selectPreferredAudioTrack = () => {
                        const streams = audioStreamsRef.current;
                        const ordinal = streams?.findIndex(
                            (s) => s.Index === audioTrackIndexRef.current
                        );
                        if (!streams || ordinal === undefined || ordinal < 0) return;
                        try {
                            const audioTracks = avplay
                                .getTotalTrackInfo()
                                .filter((track) => track.type === 'AUDIO');
                            const target = audioTracks[ordinal];
                            if (target) avplay.setSelectTrack('AUDIO', target.index);
                        } catch (error) {
                            console.error('AVPlay setSelectTrack(AUDIO) failed:', error);
                        }
                    };

                    const startPlayback = () => {
                        if (cancelled) return;
                        adapter.play();
                        selectPreferredAudioTrack();
                    };

                    if (resumeSeconds && resumeSeconds > 0) {
                        avplay.seekTo(Math.round(resumeSeconds * 1000), startPlayback, (error) => {
                            console.error('AVPlay seekTo() failed:', error);
                            startPlayback();
                        });
                    } else {
                        startPlayback();
                    }
                },
                (error) => {
                    console.error('AVPlay prepare failed:', error);
                    clearStallTimeout();
                    onPlaybackStalledRef.current?.();
                }
            );
        } catch (error) {
            console.error('Failed to open AVPlay source:', error);
            clearStallTimeout();
            onPlaybackStalledRef.current?.();
        }

        return () => {
            cancelled = true;
            clearStallTimeout();
        };
    }, [src, startTicks, pendingAudioSwitchSeekRef, armStallTimeout, clearStallTimeout]);

    const activeSubtitle =
        subtitleTrackIndex !== null ? (subtitles?.[subtitleTrackIndex] ?? null) : null;

    useEffect(() => {
        if (activeSubtitle?.format === 'ass') {
            console.error('ASS subtitles are not supported for Tizen AVPlay playback');
        }
        setActiveCueText('');
    }, [activeSubtitle]);

    useEffect(() => {
        const adapter = adapterRef.current;
        if (!adapter || activeSubtitle?.format !== 'vtt') return;

        const updateActiveCue = () => {
            const cues = subtitleVideoRef.current?.textTracks?.[0]?.cues;
            if (!cues) {
                setActiveCueText('');
                return;
            }

            const time = adapter.getCurrentTime();
            let text = '';
            for (let i = 0; i < cues.length; i++) {
                const cue = cues[i] as VTTCue;
                if (time >= cue.startTime && time <= cue.endTime) {
                    text = text ? `${text}\n${stripVttMarkup(cue.text)}` : stripVttMarkup(cue.text);
                }
            }
            setActiveCueText(text);
        };

        adapter.on('timeupdate', updateActiveCue);
        return () => adapter.off('timeupdate', updateActiveCue);
    }, [activeSubtitle]);

    useEffect(() => {
        const track = subtitleVideoRef.current?.textTracks?.[0];
        if (track) track.mode = 'hidden';
    }, [activeSubtitle]);

    return (
        <div ref={containerRef} className="w-full h-full overflow-hidden bg-transparent">
            <video ref={subtitleVideoRef} style={{ display: 'none' }} muted preload="none">
                {activeSubtitle?.format === 'vtt' && (
                    <track
                        key={activeSubtitle.src}
                        kind="subtitles"
                        src={activeSubtitle.src}
                        default
                    />
                )}
            </video>
            {activeCueText && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center px-8 pointer-events-none z-10">
                    <span className="max-w-3xl text-center text-white text-2xl font-medium whitespace-pre-line [text-shadow:0_1px_4px_rgb(0_0_0_/_80%)]">
                        {activeCueText}
                    </span>
                </div>
            )}
        </div>
    );
};

export default TizenVideoPlayer;
