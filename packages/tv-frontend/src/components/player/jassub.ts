export function getJassubUnsupportedReason(): string | null {
    if (typeof WebAssembly === 'undefined') return 'WebAssembly';
    if (typeof Worker === 'undefined') return 'Web Workers';
    if (
        typeof HTMLCanvasElement === 'undefined' ||
        !('transferControlToOffscreen' in HTMLCanvasElement.prototype)
    ) {
        return 'OffscreenCanvas';
    }
    if (
        !('requestVideoFrameCallback' in HTMLVideoElement.prototype) &&
        !('getVideoPlaybackQuality' in HTMLVideoElement.prototype) &&
        typeof requestAnimationFrame === 'undefined'
    ) {
        return 'requestVideoFrameCallback/getVideoPlaybackQuality';
    }
    return null;
}

export function installVideoFrameCallbackFallback(
    video: HTMLVideoElement,
    getMediaTime: () => number = () => video.currentTime,
    getSize: () => { width: number; height: number } = () => ({
        width: video.videoWidth,
        height: video.videoHeight,
    })
) {
    video.requestVideoFrameCallback = (callback) =>
        requestAnimationFrame((now) => {
            const { width, height } = getSize();
            callback(now, {
                presentationTime: now,
                expectedDisplayTime: now,
                width,
                height,
                mediaTime: getMediaTime(),
                presentedFrames: 0,
                processingDuration: 0,
            });
        });
    video.cancelVideoFrameCallback = (handle) => cancelAnimationFrame(handle);
}

export function overrideVideoDimensions(video: HTMLVideoElement, width: number, height: number) {
    Object.defineProperty(video, 'videoWidth', { value: width, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: height, configurable: true });
}
