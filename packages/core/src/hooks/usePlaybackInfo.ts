import { getApi } from '../api/getApi';
import { useQuery } from '@tanstack/react-query';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models';
import { getRetryConfig } from '../utils/authErrorHandler';
import { detectSupportedCodecs } from '../utils/videoCodecDetection';
import { getPlatformCapabilities } from '../api/jellyfinClient';

export type PlayMethod = 'DirectPlay' | 'DirectStream' | 'Transcode';

export interface PlaybackDecision {
    playMethod: PlayMethod;
    mediaSource: MediaSourceInfo;
    playSessionId: string;
    liveStreamId?: string;
}

function buildDeviceProfile(options?: {
    liveTvContainer?: boolean;
    excludeHevc?: boolean;
    burnInSubtitles?: boolean;
}) {
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

    const capabilities = getPlatformCapabilities();
    if (capabilities.extraDirectPlayContainers.length > 0) {
        directPlayProfiles.push({
            Container: capabilities.extraDirectPlayContainers.join(','),
            Type: 'Video' as const,
            VideoCodec: videoCodecs.join(','),
            AudioCodec: ['aac,mp3,opus,flac', ...capabilities.extraDirectPlayAudioCodecs].join(','),
        });
    }

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
        SubtitleProfiles: options?.burnInSubtitles
            ? []
            : [
                  { Format: 'vtt', Method: 'External' as const },
                  { Format: 'srt', Method: 'External' as const },
                  { Format: 'ass', Method: 'External' as const },
                  { Format: 'ssa', Method: 'External' as const },
              ],
    };
}

export interface PlaybackOptions {
    forceHls?: boolean;
    burnInSubtitleStreamIndex?: number;
    /** Set false to hold the request back, e.g. to warm a variant only once it is wanted. */
    enabled?: boolean;
}

export function usePlaybackInfo(
    itemId: string | null | undefined,
    userId: string | undefined,
    audioStreamIndex?: number,
    forceTranscode?: boolean,
    options?: PlaybackOptions
) {
    const burnInSubtitleStreamIndex = options?.burnInSubtitleStreamIndex;
    const skipDirectPlay =
        !!forceTranscode || !!options?.forceHls || burnInSubtitleStreamIndex !== undefined;

    return useQuery<PlaybackDecision>({
        queryKey: [
            'playbackInfo',
            itemId,
            audioStreamIndex,
            forceTranscode,
            options?.forceHls,
            burnInSubtitleStreamIndex,
        ],
        queryFn: async (): Promise<PlaybackDecision> => {
            const api = getApi();
            const mediaInfoApi = getMediaInfoApi(api);

            const response = await mediaInfoApi.getPostedPlaybackInfo({
                itemId: itemId!,
                userId,
                maxStreamingBitrate: 80_000_000,
                audioStreamIndex,
                subtitleStreamIndex: burnInSubtitleStreamIndex,
                enableDirectPlay: !skipDirectPlay,
                enableDirectStream: !skipDirectPlay,
                enableTranscoding: true,
                allowVideoStreamCopy: !forceTranscode,
                allowAudioStreamCopy: true,
                playbackInfoDto: {
                    DeviceProfile: buildDeviceProfile({
                        excludeHevc: forceTranscode,
                        burnInSubtitles: burnInSubtitleStreamIndex !== undefined,
                    }),
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
                        SubtitleStreamIndex: burnInSubtitleStreamIndex,
                        MaxStreamingBitrate: 80_000_000,
                        EnableDirectPlay: !skipDirectPlay,
                        EnableDirectStream: !skipDirectPlay,
                        DeviceProfile: buildDeviceProfile({
                            liveTvContainer: true,
                            excludeHevc: forceTranscode,
                            burnInSubtitles: burnInSubtitleStreamIndex !== undefined,
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
        enabled: !!itemId && options?.enabled !== false,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...getRetryConfig(),
    });
}
