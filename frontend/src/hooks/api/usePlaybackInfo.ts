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
    liveStreamId?: string;
}

function buildDeviceProfile(options?: { liveTvContainer?: boolean; excludeHevc?: boolean }) {
    const codecs = detectSupportedCodecs();

    const videoCodecs: string[] = [];
    if (codecs.h264) videoCodecs.push('h264');
    if (!options?.excludeHevc && (codecs.hevcMain || codecs.hevcMain10)) videoCodecs.push('hevc');
    if (codecs.av1) videoCodecs.push('av1');
    if (codecs.vp9) videoCodecs.push('vp9');
    if (videoCodecs.length === 0) videoCodecs.push('h264');

    const codecProfiles = [];
    if ((codecs.hevcMain || codecs.hevcMain10) && !codecs.hevcMain10) {
        codecProfiles.push({
            Type: 'Video' as const,
            Codec: 'hevc',
            Conditions: [
                {
                    Condition: 'LessThanEqual' as const,
                    Property: 'VideoBitDepth' as const,
                    Value: '8',
                    IsRequired: false,
                },
            ],
        });
    }

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
            Container: 'ts',
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

    if (!options?.liveTvContainer) {
        transcodingProfiles.unshift({
            Container: 'mp4',
            Type: 'Video' as const,
            VideoCodec: videoCodecs.join(','),
            AudioCodec: 'aac',
            Protocol: 'hls' as const,
            Context: 'Streaming' as const,
            MinSegments: 2,
            BreakOnNonKeyFrames: true,
            EnableAudioVbrEncoding: true,
        });
    }

    return {
        MaxStreamingBitrate: 80_000_000,
        MaxStaticBitrate: 100_000_000,
        DirectPlayProfiles: directPlayProfiles,
        TranscodingProfiles: transcodingProfiles,
        ContainerProfiles: [],
        CodecProfiles: codecProfiles,
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
    audioStreamIndex?: number,
    forceTranscode?: boolean
) {
    return useQuery<PlaybackDecision>({
        queryKey: ['playbackInfo', itemId, audioStreamIndex, forceTranscode],
        queryFn: async (): Promise<PlaybackDecision> => {
            const api = getApi();
            const mediaInfoApi = getMediaInfoApi(api);

            const response = await mediaInfoApi.getPostedPlaybackInfo({
                itemId: itemId!,
                userId,
                maxStreamingBitrate: 80_000_000,
                audioStreamIndex,
                enableDirectPlay: !forceTranscode,
                enableDirectStream: !forceTranscode,
                enableTranscoding: true,
                allowVideoStreamCopy: !forceTranscode,
                allowAudioStreamCopy: true,
                playbackInfoDto: {
                    DeviceProfile: buildDeviceProfile({ excludeHevc: forceTranscode }),
                },
            });

            const mediaSources = response.data.MediaSources;
            const playSessionId = response.data.PlaySessionId || '';

            if (!mediaSources || mediaSources.length === 0) {
                throw new Error('No media sources available');
            }

            let source = mediaSources[0];
            let liveStreamId: string | undefined;

            // live TV channels return a placeholder MediaSource that must be "opened" (starting the tuner stream) before it has a usable playback URL
            if (source.RequiresOpening) {
                const openResponse = await mediaInfoApi.openLiveStream({
                    openLiveStreamDto: {
                        OpenToken: source.OpenToken,
                        UserId: userId,
                        PlaySessionId: playSessionId,
                        ItemId: itemId,
                        AudioStreamIndex: audioStreamIndex,
                        MaxStreamingBitrate: 80_000_000,
                        EnableDirectPlay: !forceTranscode,
                        EnableDirectStream: !forceTranscode,
                        DeviceProfile: buildDeviceProfile({
                            liveTvContainer: true,
                            excludeHevc: forceTranscode,
                        }),
                    },
                });

                if (openResponse.data.MediaSource) {
                    source = openResponse.data.MediaSource;
                    liveStreamId = source.LiveStreamId || undefined;
                }
            }

            let playMethod: PlayMethod;
            if (source.SupportsDirectPlay) {
                playMethod = 'DirectPlay';
            } else if (source.SupportsDirectStream) {
                playMethod = 'DirectStream';
            } else {
                playMethod = 'Transcode';
            }

            return { playMethod, mediaSource: source, playSessionId, liveStreamId };
        },
        enabled: !!itemId,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...getRetryConfig(),
    });
}
