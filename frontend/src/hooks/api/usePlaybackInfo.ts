import { getApi } from '@/api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '@/utils/authErrorHandler';
import { detectSupportedCodecs } from '@/utils/videoCodecDetection';

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode';

export interface PlaybackDecision {
    playMethod: PlayMethod;
    mediaSource: MediaSourceInfo;
    playSessionId: string;
}

function buildDeviceProfile() {
    const codecs = detectSupportedCodecs();

    const videoCodecs: string[] = [];
    if (codecs.h264) videoCodecs.push('h264');
    if (codecs.hevc) videoCodecs.push('hevc');
    if (codecs.av1) videoCodecs.push('av1');
    if (codecs.vp9) videoCodecs.push('vp9');
    if (videoCodecs.length === 0) videoCodecs.push('h264');

    const directPlayProfiles = [
        {
            Container: 'mp4,webm',
            Type: 'Video' as const,
            VideoCodec: videoCodecs.join(','),
            AudioCodec: 'aac,mp3,opus,flac',
        },
    ];

    const transcodingProfiles = [
        {
            Container: 'mp4',
            Type: 'Video' as const,
            VideoCodec: videoCodecs.join(','),
            AudioCodec: 'aac',
            Protocol: 'hls' as const,
            Context: 'Streaming' as const,
            MinSegments: 2,
            BreakOnNonKeyFrames: true,
            EnableAudioVbrEncoding: true,
        },
    ];

    return {
        MaxStreamingBitrate: 80_000_000,
        MaxStaticBitrate: 100_000_000,
        DirectPlayProfiles: directPlayProfiles,
        TranscodingProfiles: transcodingProfiles,
        ContainerProfiles: [],
        CodecProfiles: [],
        SubtitleProfiles: [
            { Format: 'vtt', Method: 'External' as const },
            { Format: 'srt', Method: 'External' as const },
            { Format: 'ass', Method: 'External' as const },
            { Format: 'ssa', Method: 'External' as const },
        ],
    };
}

export function usePlaybackInfo(
    itemId: string | null | undefined,
    userId: string | undefined,
    audioStreamIndex?: number
) {
    return useQuery<PlaybackDecision>({
        queryKey: ['playbackInfo', itemId, audioStreamIndex],
        queryFn: async (): Promise<PlaybackDecision> => {
            const api = getApi();
            const mediaInfoApi = getMediaInfoApi(api);

            const response = await mediaInfoApi.getPostedPlaybackInfo({
                itemId: itemId!,
                userId,
                maxStreamingBitrate: 80_000_000,
                audioStreamIndex,
                enableDirectPlay: true,
                enableDirectStream: true,
                enableTranscoding: true,
                allowVideoStreamCopy: true,
                allowAudioStreamCopy: true,
                playbackInfoDto: {
                    DeviceProfile: buildDeviceProfile(),
                },
            });

            const mediaSources = response.data.MediaSources;
            const playSessionId = response.data.PlaySessionId || '';

            if (!mediaSources || mediaSources.length === 0) {
                throw new Error('No media sources available');
            }

            const source = mediaSources[0];

            let playMethod: PlayMethod;
            if (source.SupportsDirectPlay) {
                playMethod = 'DirectPlay';
            } else if (source.SupportsDirectStream) {
                playMethod = 'DirectStream';
            } else {
                playMethod = 'Transcode';
            }

            return { playMethod, mediaSource: source, playSessionId };
        },
        enabled: !!itemId,
        staleTime: 30_000,
        ...getRetryConfig(),
    });
}
