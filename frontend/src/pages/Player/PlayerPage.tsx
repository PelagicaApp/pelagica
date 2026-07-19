/* eslint-disable @typescript-eslint/no-explicit-any */
import { useReportPlaybackProgress } from '@/hooks/api/usePlaybackProgress';
import { usePlaybackStart } from '@/hooks/api/usePlaybackStart';
import { usePlaybackStop } from '@/hooks/api/usePlaybackStop';
import { useCloseLiveStream } from '@/hooks/api/useCloseLiveStream';
import { useParams } from 'react-router';
import VideoPlayer, { type SubtitleTrack } from '@/pages/Player/VideoPlayer';
import PlayerControls from '@/pages/Player/PlayerControls';
import PlayerLoading from '@/pages/Player/PlayerLoading';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
    getPrimaryImageUrl,
    getSubtitleUrl,
    getPlaybackStreamUrl,
    getAttachmentUrl,
} from '@/utils/jellyfinUrls';
import { usePlaybackInfo } from '@/hooks/api/usePlaybackInfo';
import { useMediaSegments } from '@/hooks/api/useMediaSegments';
import { useAdjacentItems } from '@/hooks/api/useAdjacentItems';
import { getUserId } from '@/utils/localstorageCredentials';
import { getLastAudioLanguage, getLastSubtitleLanguage } from '@/utils/localstorageLastlanguage';
import { useUserConfiguration } from '@/hooks/api/playbackPreferences/useUserConfiguration';
import { usePlayerItem } from '@/hooks/api/usePlayerItem';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { clearCodecCache } from '@/utils/videoCodecDetection';
import { hideTrafficLights, showTrafficLights } from '@/utils/desktopApp';

const PLAYBACK_PROGRESS_REPORT_MIN_PLAYTIME_SECONDS = 5;
const PLAYBACK_PROGRESS_REPORT_INTERVAL_MS = 5000;
const FONT_ATTACHMENT_EXTENSION_PATTERN = /\.(ttf|otf|woff2?)$/i;

export type VideoJsPlayer = ReturnType<typeof import('video.js').default>;

const PlayerPage = () => {
    const { t } = useTranslation('player');
    const params = useParams<{ itemId: string }>();
    const itemId = params.itemId;
    const hasUserSelectedSubtitleRef = useRef(false);
    const hasUserSelectedAudioRef = useRef(false);
    const hasAttemptedTranscodeFallbackRef = useRef(false);
    const [player, setPlayer] = useState<VideoJsPlayer | null>(null);
    const [forceTranscode, setForceTranscode] = useState(false);
    const {
        data: userConfiguration,
        isLoading: isLoadingUserConfiguration,
        error: userConfigurationError,
    } = useUserConfiguration(getUserId());
    const { data: item, isLoading, error } = usePlayerItem(itemId, true);

    const resolvedAudio = useMemo(() => {
        if (!item || !userConfiguration) {
            return { index: 1, matchedPreferred: false };
        }

        const lastAudio = getLastAudioLanguage(item.Id!);
        if (lastAudio !== null) {
            return { index: lastAudio, matchedPreferred: false };
        }

        const preferred = userConfiguration.AudioLanguagePreference;
        if (!preferred) {
            return { index: 1, matchedPreferred: false };
        }

        const audioStreams = item.MediaStreams?.filter((s) => s.Type === 'Audio');

        const match = audioStreams?.find((s) => s.Language === preferred);

        if (match?.Index != null) {
            return { index: match.Index, matchedPreferred: true };
        }

        return { index: 1, matchedPreferred: false };
    }, [item, userConfiguration]);

    const resolvedSubtitleTrackIndex = useMemo(() => {
        if (!item || !userConfiguration) return null;

        const lastSubtitle = getLastSubtitleLanguage(item.Id!);
        if (lastSubtitle !== null) return lastSubtitle;

        const preferred = userConfiguration.SubtitleLanguagePreference;
        if (!preferred) return null;

        const subtitleStreams = item.MediaStreams?.filter((s) => s.Type === 'Subtitle');

        const match = subtitleStreams?.findIndex((s) => s.Language === preferred);

        if (match !== undefined && match >= 0) return match;
        return null;
    }, [item, userConfiguration]);

    const [audioTrackIndex, setAudioTrackIndex] = useState<number>(resolvedAudio.index);
    const [subtitleTrackIndex, setSubtitleTrackIndex] = useState<number | null>(
        resolvedSubtitleTrackIndex
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const progressReportingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPositionRef = useRef<number>(0);
    const liveStreamIdRef = useRef<string | undefined>(undefined);
    const isAudioSwitchRef = useRef(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const {
        data: adjacentItems,
        isLoading: isLoadingAdjacentItems,
        error: adjacentItemsError,
    } = useAdjacentItems(item, getUserId());
    const {
        data: mediaSegments,
        isLoading: isLoadingMediaSegments,
        error: mediaSegmentsError,
    } = useMediaSegments(itemId);
    const {
        data: playbackInfo,
        isLoading: isLoadingPlaybackInfo,
        error: playbackInfoError,
    } = usePlaybackInfo(itemId, getUserId() || undefined, audioTrackIndex, forceTranscode);

    const playSessionId = playbackInfo?.playSessionId || '';

    const streamResult = useMemo(() => {
        if (!itemId || !playbackInfo) return null;

        return getPlaybackStreamUrl(itemId, playbackInfo.playMethod, {
            playSessionId: playbackInfo.playSessionId,
            audioStreamIndex: audioTrackIndex,
            mediaSourceId: playbackInfo.mediaSource.Id || undefined,
            container: playbackInfo.mediaSource.Container?.split(',')[0] || undefined,
            transcodingUrl: playbackInfo.mediaSource.TranscodingUrl,
        });
    }, [itemId, playbackInfo, audioTrackIndex]);

    const { reportProgress } = useReportPlaybackProgress();
    const { startPlayback } = usePlaybackStart();
    const { stopPlayback } = usePlaybackStop();
    const { closeLiveStream } = useCloseLiveStream();
    const { clearPlayback } = useMusicPlayback();

    useEffect(() => {
        liveStreamIdRef.current = playbackInfo?.liveStreamId;
    }, [playbackInfo?.liveStreamId]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Hide the macOS traffic lights while the player is open so they don't cover the back button
    useEffect(() => {
        hideTrafficLights();
        return () => {
            showTrafficLights();
        };
    }, []);

    // Reset everything when navigating to a new item
    useEffect(() => {
        queueMicrotask(() => {
            hasUserSelectedAudioRef.current = false;
            hasUserSelectedSubtitleRef.current = false;
            isAudioSwitchRef.current = false;
            hasAttemptedTranscodeFallbackRef.current = false;

            setPlayer(null);
            setForceTranscode(false);
            setAudioTrackIndex(resolvedAudio.index);
            setSubtitleTrackIndex(resolvedSubtitleTrackIndex);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId]);

    useEffect(() => {
        if (resolvedSubtitleTrackIndex === null) return;
        if (hasUserSelectedSubtitleRef.current) return;

        // Don't enable subtitles if the audio matched preferred language
        if (resolvedAudio.matchedPreferred) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSubtitleTrackIndex(resolvedSubtitleTrackIndex);
    }, [resolvedSubtitleTrackIndex, resolvedAudio.matchedPreferred]);

    useEffect(() => {
        if (resolvedAudio.index === null) return;
        if (hasUserSelectedAudioRef.current) return;

        setAudioTrackIndex(resolvedAudio.index);
    }, [resolvedAudio.index]);

    const posterUrl = useMemo(() => {
        if (!item?.Id) return undefined;
        return getPrimaryImageUrl(item?.Id);
    }, [item?.Id]);

    const startTicks = item?.UserData?.PlaybackPositionTicks || 0;

    const handleToggleFullscreen = () => {
        if (!containerRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if ((containerRef.current as any).webkitRequestFullscreen) {
                (containerRef.current as any).webkitRequestFullscreen();
            } else if ((containerRef.current as any).mozRequestFullScreen) {
                (containerRef.current as any).mozRequestFullScreen();
            } else if ((containerRef.current as any).msRequestFullscreen) {
                (containerRef.current as any).msRequestFullscreen();
            }
        }
    };

    useEffect(() => {
        if (!itemId || !player) return;

        // Clear any music playback when starting video
        clearPlayback();

        // Report playback start
        startPlayback({ itemId, positionTicks: startTicks, playSessionId });

        const reportPlayerProgress = () => {
            if (!player || player.isDisposed?.()) return;

            try {
                const currentTime = player.currentTime() || 0;
                if (currentTime <= PLAYBACK_PROGRESS_REPORT_MIN_PLAYTIME_SECONDS) return;
                const positionTicks = Math.floor(currentTime * 10000000); // Convert to ticks
                const isPaused = player.paused();
                const volumeLevel = (player.volume() ?? 1) * 100;
                const isMuted = player.muted();

                lastPositionRef.current = positionTicks;

                reportProgress({
                    itemId,
                    positionTicks,
                    isPaused,
                    playSessionId,
                    volumeLevel,
                    isMuted,
                });
            } catch (error) {
                console.error('Error reporting progress:', error);
            }
        };

        // Report playback progress every X seconds
        reportPlayerProgress();
        progressReportingIntervalRef.current = setInterval(
            reportPlayerProgress,
            PLAYBACK_PROGRESS_REPORT_INTERVAL_MS
        );

        return () => {
            // Clear interval first
            if (progressReportingIntervalRef.current) {
                clearInterval(progressReportingIntervalRef.current);
            }

            // Here we need the last know position since the player might be already in the shadow realm
            stopPlayback({ itemId, positionTicks: lastPositionRef.current });

            if (liveStreamIdRef.current) {
                closeLiveStream(liveStreamIdRef.current);
                liveStreamIdRef.current = undefined;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        itemId,
        player,
        reportProgress,
        startPlayback,
        startTicks,
        stopPlayback,
        closeLiveStream,
        clearPlayback,
    ]);

    useEffect(() => {
        lastPositionRef.current = startTicks;
    }, [startTicks]);

    const handlePlaybackError = useCallback(
        (mediaError: MediaError | null) => {
            if (!mediaError || mediaError.code !== MediaError.MEDIA_ERR_DECODE) return;

            if (hasAttemptedTranscodeFallbackRef.current) {
                toast.error(t('playbackDecodeErrorFailed'));
                return;
            }

            hasAttemptedTranscodeFallbackRef.current = true;
            clearCodecCache();
            toast.error(t('playbackDecodeErrorRetrying'));
            setForceTranscode(true);
        },
        [t]
    );

    const handleAudioTrackChange = (index: number) => {
        isAudioSwitchRef.current = true;
        hasUserSelectedAudioRef.current = true;
        setAudioTrackIndex(index);
    };

    const handleSubtitleTrackChange = (index: number | null) => {
        hasUserSelectedSubtitleRef.current = true;
        setSubtitleTrackIndex(index);
    };

    useEffect(() => {
        if (!player) return;

        const tracks = player.textTracks();
        for (let i = 0; i < tracks.tracks_.length; i++) {
            const track = tracks.tracks_[i];
            if (subtitleTrackIndex === null) {
                track.mode = 'disabled';
            } else if (i === subtitleTrackIndex) {
                track.mode = 'showing';
            } else {
                track.mode = 'disabled';
            }
        }
    }, [player, subtitleTrackIndex]);

    const subtitleTracks = useMemo(() => {
        if (!item?.Id || !item?.MediaStreams) return [];

        const subtitles = item.MediaStreams.filter((s) => s.Type === 'Subtitle');

        return subtitles.map((subtitle): SubtitleTrack => {
            const codec = subtitle.Codec?.toLowerCase();
            const isAss = codec === 'ass' || codec === 'ssa';

            return {
                src: getSubtitleUrl(
                    item.Id!,
                    item.Id!,
                    subtitle.Index || 0,
                    isAss ? (codec as 'ass' | 'ssa') : 'vtt'
                ),
                srclang: subtitle.Language || 'unknown',
                label: subtitle.DisplayTitle || subtitle.Language || `Subtitle ${subtitle.Index}`,
                default: subtitle.IsDefault || false,
                format: isAss ? 'ass' : 'vtt',
            };
        });
    }, [item]);

    const subtitleFonts = useMemo(() => {
        const attachments = playbackInfo?.mediaSource.MediaAttachments;
        if (!attachments || attachments.length === 0) return [];

        return attachments
            .filter(
                (attachment) =>
                    attachment.DeliveryUrl &&
                    (attachment.MimeType?.startsWith('font/') ||
                        FONT_ATTACHMENT_EXTENSION_PATTERN.test(attachment.FileName || ''))
            )
            .map((attachment) => getAttachmentUrl(attachment.DeliveryUrl!));
    }, [playbackInfo?.mediaSource.MediaAttachments]);

    if (
        isLoading ||
        isLoadingMediaSegments ||
        isLoadingAdjacentItems ||
        isLoadingUserConfiguration ||
        isLoadingPlaybackInfo
    ) {
        return <PlayerLoading />;
    }

    if (
        error ||
        mediaSegmentsError ||
        adjacentItemsError ||
        userConfigurationError ||
        playbackInfoError
    ) {
        return (
            <p>
                Error loading item:{' '}
                {error?.message ||
                    mediaSegmentsError?.message ||
                    adjacentItemsError?.message ||
                    userConfigurationError?.message ||
                    playbackInfoError?.message}
            </p>
        );
    }

    if (!item || !streamResult) {
        return <p>Item not found</p>;
    }

    return (
        <div ref={containerRef} className="relative w-full h-screen bg-black flex overflow-hidden">
            <VideoPlayer
                key={itemId}
                src={streamResult.url}
                srcType={streamResult.mimeType}
                poster={posterUrl}
                onReady={setPlayer}
                onPlaybackError={handlePlaybackError}
                startTicks={item.UserData?.PlaybackPositionTicks || 0}
                subtitles={subtitleTracks}
                subtitleFonts={subtitleFonts}
                isAudioSwitchRef={isAudioSwitchRef}
                subtitleTrackIndex={subtitleTrackIndex}
            />
            <PlayerControls
                item={item}
                player={player}
                audioTrackIndex={audioTrackIndex}
                onAudioTrackChange={handleAudioTrackChange}
                subtitleTrackIndex={subtitleTrackIndex}
                onSubtitleTrackChange={handleSubtitleTrackChange}
                isFullscreen={isFullscreen}
                onFullscreenToggle={handleToggleFullscreen}
                mediaSegments={mediaSegments}
                previousItem={adjacentItems?.previousItem}
                nextItem={adjacentItems?.nextItem}
                srcUrl={streamResult.url}
                containerRef={containerRef}
            />
        </div>
    );
};

export default PlayerPage;
