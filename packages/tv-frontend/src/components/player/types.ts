import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
import type { SubtitleTrack, TvPlayer } from '@pelagica/tv-platform';

export interface VideoPlayerProps {
    src: string;
    srcType?: string;
    startTicks: number;
    subtitles?: SubtitleTrack[];
    subtitleFonts?: string[];
    onReady?: (player: TvPlayer) => void;
    onPlaybackError?: (error: MediaError | null) => void;
    onPlaybackStalled?: () => void;
    pendingAudioSwitchSeekRef: React.MutableRefObject<number | null>;
    subtitleTrackIndex: number | null;
    /**
     * The `MediaStreams[].Index` of the audio track the caller wants active. Only used by
     * TizenVideoPlayer: Jellyfin's direct-play URLs are static byte streams that ignore
     * `AudioStreamIndex`, so switching tracks has to go through AVPlay's own
     * `setSelectTrack` on the already-demuxed file rather than the requested URL.
     */
    audioTrackIndex?: number | null;
    /** Ordered list of the item's audio streams, used to map `audioTrackIndex` onto AVPlay's track list. */
    audioStreams?: MediaStream[];
}
