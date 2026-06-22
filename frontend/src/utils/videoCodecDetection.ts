interface CodecSupport {
    av1: boolean;
    hevc: boolean;
    vp9: boolean;
    h264: boolean;
}

let cachedCodecSupport: CodecSupport | null = null;

/**
 * Check if a specific MIME type is supported by the browser
 */
function canPlayType(mimeType: string): boolean {
    const video = document.createElement('video');
    const support = video.canPlayType(mimeType);
    return support === 'probably' || support === 'maybe';
}

/**
 * Detect which video codecs are supported by the current browser.
 */
export function detectSupportedCodecs(): CodecSupport {
    if (cachedCodecSupport) {
        return cachedCodecSupport;
    }

    const support: CodecSupport = {
        av1:
            canPlayType('video/mp4; codecs="av01.0.05M.08"') || // Main profile, level 3.0
            canPlayType('video/webm; codecs="av01.0.05M.08"'),
        hevc:
            canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') || // Main profile
            canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') || // Main profile (alternative)
            canPlayType('video/mp4; codecs="hev1.2.4.L93.B0"') || // Main 10 profile
            canPlayType('video/mp4; codecs="hvc1.2.4.L93.B0"'), // Main 10 profile (alternative)
        vp9:
            canPlayType('video/webm; codecs="vp9"') ||
            canPlayType('video/webm; codecs="vp09.00.10.08"'), // Profile 0, level 1.0
        h264:
            canPlayType('video/mp4; codecs="avc1.42E01E"') || // Baseline profile
            canPlayType('video/mp4; codecs="avc1.4D401E"') || // Main profile
            canPlayType('video/mp4; codecs="avc1.64001E"'), // High profile
    };

    cachedCodecSupport = support;

    return support;
}

/**
 * Get a comma-separated list of supported video codecs in order of preference
 */
export function getSupportedVideoCodecs(): string {
    const support = detectSupportedCodecs();
    const codecs: string[] = [];

    if (support.av1) codecs.push('av1');
    if (support.hevc) codecs.push('hevc');
    if (support.vp9) codecs.push('vp9');
    if (support.h264) codecs.push('h264');

    // Fallbacl to h264 if no codecs detected
    if (codecs.length === 0) codecs.push('h264');

    return codecs.join(',');
}

export function clearCodecCache(): void {
    cachedCodecSupport = null;
}
