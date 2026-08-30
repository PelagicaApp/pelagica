import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBackKeyIntercept, useParams } from '@/router';
import { useTranslation } from 'react-i18next';
import {
    useReportPlaybackProgress,
    usePlaybackStart,
    usePlaybackStop,
    useCloseLiveStream,
    usePlaybackInfo,
    useMediaSegments,
    useAdjacentItems,
    useUserConfiguration,
    usePlayerItem,
    getPrimaryImageUrl,
    getSubtitleUrl,
    getPlaybackStreamUrl,
    getAttachmentUrl,
    getUserId,
    clearCodecCache,
    getPlatform,
} from '@pelagica/core';
import { type SubtitleTrack, type TvPlayer } from '@pelagica/tv-platform';
import PlatformVideoPlayer from '@/components/player/PlatformVideoPlayer';
import PlayerControls, { type PlayerControlsHandle } from '@/components/player/PlayerControls';
import PlayerLoading from '@/components/player/PlayerLoading';
import { getLastAudioLanguage, getLastSubtitleLanguage } from '@/lib/localstorageLastlanguage';

const PLAYBACK_PROGRESS_REPORT_MIN_PLAYTIME_SECONDS = 5;
const PLAYBACK_PROGRESS_REPORT_INTERVAL_MS = 5000;
const FONT_ATTACHMENT_EXTENSION_PATTERN = /\.(ttf|otf|woff2?)$/i;

const Player = () => {
    const controlsRef = useRef<PlayerControlsHandle>(null);
    const handleBackKeyIntercept = useCallback(() => {
        return controlsRef.current?.handleBackKey() ?? false;
    }, []);
    useBackKeyIntercept(handleBackKeyIntercept);
    const { t } = useTranslation(['player', 'item']);

    const { itemId } = useParams<{ itemId: string }>();
    const hasUserSelectedSubtitleRef = useRef(false);
    const hasUserSelectedAudioRef = useRef(false);
    const hasAttemptedTranscodeFallbackRef = useRef(false);
    const [player, setPlayer] = useState<TvPlayer | null>(null);
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
    const progressReportingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPositionRef = useRef<number>(0);
    const liveStreamIdRef = useRef<string | undefined>(undefined);
    const isAudioSwitchRef = useRef(false);
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

    useEffect(() => {
        liveStreamIdRef.current = playbackInfo?.liveStreamId;
    }, [playbackInfo?.liveStreamId]);

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
        return getPrimaryImageUrl(item?.Id, { width: 1920 });
    }, [item?.Id]);

    const startTicks = item?.UserData?.PlaybackPositionTicks || 0;

    useEffect(() => {
        if (!itemId || !player) return;

        startPlayback({ itemId, positionTicks: startTicks, playSessionId });

        const reportPlayerProgress = () => {
            if (!player || player.isDisposed()) return;

            try {
                const currentTime = player.getCurrentTime();
                if (currentTime <= PLAYBACK_PROGRESS_REPORT_MIN_PLAYTIME_SECONDS) return;
                const positionTicks = Math.floor(currentTime * 10000000);
                const isPaused = player.isPaused();
                const volumeLevel = player.getVolume() * 100;
                const isMuted = player.isMuted();

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

        reportPlayerProgress();
        progressReportingIntervalRef.current = setInterval(
            reportPlayerProgress,
            PLAYBACK_PROGRESS_REPORT_INTERVAL_MS
        );

        return () => {
            if (progressReportingIntervalRef.current) {
                clearInterval(progressReportingIntervalRef.current);
            }

            // Here we need the last known position since the player might already be disposed
            stopPlayback({ itemId, positionTicks: lastPositionRef.current });

            if (liveStreamIdRef.current) {
                closeLiveStream(liveStreamIdRef.current);
                liveStreamIdRef.current = undefined;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId, player, reportProgress, startPlayback, startTicks, stopPlayback, closeLiveStream]);

    useEffect(() => {
        lastPositionRef.current = startTicks;
    }, [startTicks]);

    const attemptTranscodeFallback = useCallback(() => {
        if (hasAttemptedTranscodeFallbackRef.current) return;

        hasAttemptedTranscodeFallbackRef.current = true;
        clearCodecCache();
        setForceTranscode(true);
    }, []);

    const handlePlaybackError = useCallback(
        (mediaError: MediaError | null) => {
            if (!mediaError || mediaError.code !== MediaError.MEDIA_ERR_DECODE) return;
            attemptTranscodeFallback();
        },
        [attemptTranscodeFallback]
    );

    const handlePlaybackStalled = useCallback(() => {
        attemptTranscodeFallback();
    }, [attemptTranscodeFallback]);

    const handleAudioTrackChange = (index: number) => {
        isAudioSwitchRef.current = true;
        hasUserSelectedAudioRef.current = true;
        setAudioTrackIndex(index);
    };

    const handleSubtitleTrackChange = (index: number | null) => {
        hasUserSelectedSubtitleRef.current = true;
        setSubtitleTrackIndex(index);
    };

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

    const audioStreams = useMemo(() => {
        return item?.MediaStreams?.filter((s) => s.Type === 'Audio') ?? [];
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
                {t('player:errorLoadingItem', {
                    message:
                        error?.message ||
                        mediaSegmentsError?.message ||
                        adjacentItemsError?.message ||
                        userConfigurationError?.message ||
                        playbackInfoError?.message,
                })}
            </p>
        );
    }

    if (!item || !streamResult) {
        return <p>{t('item:item_not_found')}</p>;
    }

    return (
        <div
            className={`relative w-full h-svh flex overflow-hidden ${
                getPlatform() === 'tizen' ? 'bg-transparent' : 'bg-black'
            }`}
        >
            <PlatformVideoPlayer
                key={itemId}
                src={streamResult.url}
                srcType={streamResult.mimeType}
                poster={posterUrl}
                onReady={setPlayer}
                onPlaybackError={handlePlaybackError}
                onPlaybackStalled={handlePlaybackStalled}
                startTicks={item.UserData?.PlaybackPositionTicks || 0}
                subtitles={subtitleTracks}
                subtitleFonts={subtitleFonts}
                isAudioSwitchRef={isAudioSwitchRef}
                subtitleTrackIndex={subtitleTrackIndex}
                audioTrackIndex={audioTrackIndex}
                audioStreams={audioStreams}
            />
            <PlayerControls
                ref={controlsRef}
                item={item}
                player={player}
                audioTrackIndex={audioTrackIndex}
                onAudioTrackChange={handleAudioTrackChange}
                subtitleTrackIndex={subtitleTrackIndex}
                onSubtitleTrackChange={handleSubtitleTrackChange}
                mediaSegments={mediaSegments}
                previousItem={adjacentItems?.previousItem}
                nextItem={adjacentItems?.nextItem}
            />
        </div>
    );
};

export default Player;
