import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models';

const IMAGE_BASED_CODECS = new Set([
    'pgssub',
    'pgs',
    'dvdsub',
    'dvbsub',
    'vobsub',
    'xsub',
    'hdmv_pgs_subtitle',
    'dvb_subtitle',
]);

/** Image-based subtitles can't be overlaid in the browser and must be burned in server-side */
export function isImageBasedSubtitle(stream: MediaStream): boolean {
    if (stream.IsTextSubtitleStream === false) return true;
    return IMAGE_BASED_CODECS.has((stream.Codec || '').toLowerCase());
}
