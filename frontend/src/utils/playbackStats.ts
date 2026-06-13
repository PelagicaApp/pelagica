/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VideoJsPlayer } from '@/pages/Player/PlayerPage';
import type { BaseItemDto, SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models';

interface PlaybackInfo {
    player: string;
    transcoding: boolean;
    protocol: 'http' | 'https' | 'data' | 'unknown';
}

interface VideoInfo {
    playerDimensions: { width: number; height: number };
    videoResolution: { width: number; height: number };
    droppedFrames: number;
    corruptedFrames: number;
    totalFrames: number;
}

interface MediaInfo {
    container: string;
    size: number;
    bitrateKbps: number;
    videoCodec: string | null;
    videoBitrateKbps: number | null;
    videoRangeType: string | null;
    audioCodec: string | null;
    audioBitrateKbps: number | null;
    audioChannels: number | null;
    audioSampleRate: number | null;
}

export interface RuntimePlaybackStats {
    playbackInfo: PlaybackInfo;
    videoInfo: VideoInfo;
    mediaInfo: MediaInfo;
    src: string | null;
}

export const getRuntimePlaybackStats = (
    player: VideoJsPlayer | null,
    item: BaseItemDto,
    session: SessionInfoDto | undefined,
    selectedAudiStreamIndex: number | null,
    srcUrl: string
): RuntimePlaybackStats | null => {
    if (!player || !session) return null;

    const tech = player.tech({ IWillNotUseThisInPlugins: true });
    const videoEl = tech?.el() as HTMLVideoElement | undefined;
    if (!videoEl) return null;

    const quality = videoEl.getVideoPlaybackQuality?.() ?? {
        droppedVideoFrames: (videoEl as any).webkitDroppedFrameCount ?? 0,
        corruptedVideoFrames: (videoEl as any).webkitCorruptedFrameCount ?? 0,
        totalVideoFrames: (videoEl as any).webkitDecodedFrameCount ?? 0,
    };

    const protocol = srcUrl
        ? srcUrl.startsWith('https')
            ? 'https'
            : srcUrl.startsWith('http')
              ? 'http'
              : 'data'
        : 'unknown';

    const videoStream = item.MediaStreams?.find((s) => s.Type === 'Video');
    const audioStreams = item.MediaStreams?.filter((s) => s.Type === 'Audio') || [];
    const audioStream =
        selectedAudiStreamIndex !== null && selectedAudiStreamIndex < audioStreams.length
            ? audioStreams[selectedAudiStreamIndex]
            : audioStreams[0];

    const toKbps = (value: number | null | undefined) =>
        value != null ? Math.round(value / 1000) : null;
    const containerBitrate = item.MediaSources?.[0]?.Bitrate ?? 0;

    return {
        playbackInfo: {
            player: 'Html Video Player',
            protocol: protocol,
            transcoding: session.TranscodingInfo !== null && session.TranscodingInfo !== undefined,
        },
        videoInfo: {
            playerDimensions: {
                width: videoEl.videoWidth,
                height: videoEl.videoHeight,
            },
            videoResolution: {
                width: item.MediaStreams?.find((s) => s.Type === 'Video')?.Width || 0,
                height: item.MediaStreams?.find((s) => s.Type === 'Video')?.Height || 0,
            },
            droppedFrames: quality.droppedVideoFrames,
            corruptedFrames: quality.corruptedVideoFrames,
            totalFrames: quality.totalVideoFrames,
        },
        mediaInfo: {
            container: item.Container || 'unknown',
            size: item.MediaSources?.reduce((sum, source) => sum + (source.Size ?? 0), 0) ?? 0,
            bitrateKbps: toKbps(containerBitrate) ?? 0,
            videoCodec: videoStream?.Codec || null,
            videoBitrateKbps: toKbps(videoStream?.BitRate) ?? null,
            videoRangeType: videoStream?.VideoRangeType || null,
            audioCodec: audioStream?.Codec || null,
            audioBitrateKbps: toKbps(audioStream?.BitRate) ?? null,
            audioChannels: audioStream?.Channels || null,
            audioSampleRate: audioStream?.SampleRate || null,
        },
        src: srcUrl || null,
    };
};
