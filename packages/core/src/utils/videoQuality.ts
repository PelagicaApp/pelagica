import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models';

/**
 * Get a video quality label (e.g. SD, HD, 4K) based on the provided media streams.
 * @param streams The media streams of the video
 * @returns A string representing the video quality
 */
export function getVideoQualityLabel(streams: MediaStream[]): string {
    const videoStream = streams
        .filter((s) => s.Type === 'Video')
        .sort((a, b) => (b.Height || 0) - (a.Height || 0))[0];
    if (!videoStream || !videoStream.Height) return 'Unknown';

    const height = videoStream.Height || 0;

    if (height >= 2160) {
        return '4K';
    } else if (height >= 1440) {
        return '2K';
    } else if (height >= 1080) {
        return 'Full HD';
    } else if (height >= 720) {
        return 'HD';
    } else if (height >= 480) {
        return 'SD';
    } else {
        return 'Potato Quality';
    }
}
