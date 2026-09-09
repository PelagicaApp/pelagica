import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
import { getUserId, useUserConfiguration } from '@pelagica/core';
import { useMemo, useState } from 'react';
import type { PlayerTrackSelection } from '@/utils/playerUrl';
import {
    resolveDefaultAudioIndex,
    resolveDefaultSubtitleIndex,
    setLastAudioSelection,
    setLastSubtitleSelection,
} from '@/utils/trackMemory';

export interface TrackSelectionState {
    audioStreams: MediaStream[];
    subtitleStreams: MediaStream[];
    /** Absolute MediaStream.Index of the selected audio track, null when there is none */
    audioIndex: number | null;
    /** Position within subtitleStreams, null = disabled */
    subtitleIndex: number | null;
    selectAudio: (index: number) => void;
    selectSubtitle: (index: number | null) => void;
    /** Ready to pass to buildPlayerUrl */
    trackSelection: PlayerTrackSelection;
}

/**
 * Owns the audio/subtitle track selection for an item before playback.
 * Defaults follow: last used for this movie/show, then the account's language
 * preferences, then media default audio with subtitles disabled. Selections
 * are remembered for the movie/show.
 */
export function useTrackSelection(
    mediaKey: string | null | undefined,
    itemId: string | null | undefined,
    mediaStreams: MediaStream[] | null | undefined
): TrackSelectionState {
    const { data: userConfiguration } = useUserConfiguration(getUserId());

    const audioStreams = useMemo(
        () => (mediaStreams ?? []).filter((s) => s.Type === 'Audio'),
        [mediaStreams]
    );
    const subtitleStreams = useMemo(
        () => (mediaStreams ?? []).filter((s) => s.Type === 'Subtitle'),
        [mediaStreams]
    );

    // undefined = follow default; subtitle null = explicitly disabled
    const [selection, setSelection] = useState<{
        key: MediaStream[] | null | undefined;
        audio?: number;
        subtitle?: number | null;
    }>({ key: mediaStreams });
    if (selection.key !== mediaStreams) {
        setSelection({ key: mediaStreams });
    }

    const defaultAudioIndex = useMemo(
        () =>
            resolveDefaultAudioIndex(
                audioStreams,
                mediaKey,
                itemId,
                userConfiguration?.AudioLanguagePreference
            ),
        [audioStreams, mediaKey, itemId, userConfiguration]
    );

    const defaultSubtitleIndex = useMemo(
        () =>
            resolveDefaultSubtitleIndex(
                subtitleStreams,
                mediaKey,
                itemId,
                userConfiguration?.SubtitleLanguagePreference
            ),
        [subtitleStreams, mediaKey, itemId, userConfiguration]
    );

    const audioIndex = selection.audio !== undefined ? selection.audio : defaultAudioIndex;
    const subtitleIndex =
        selection.subtitle !== undefined ? selection.subtitle : defaultSubtitleIndex;

    const trackSelection = useMemo<PlayerTrackSelection>(
        () => ({
            audioIndex: audioIndex ?? undefined,
            subtitleIndex: subtitleStreams.length > 0 ? subtitleIndex : undefined,
        }),
        [audioIndex, subtitleIndex, subtitleStreams.length]
    );

    const selectAudio = (index: number) => {
        setSelection((prev) => ({ ...prev, audio: index }));
        if (!mediaKey || !itemId) return;
        const stream = audioStreams.find((s) => s.Index === index);
        setLastAudioSelection(mediaKey, {
            language: stream?.Language ?? null,
            index,
            itemId,
        });
    };

    const selectSubtitle = (index: number | null) => {
        setSelection((prev) => ({ ...prev, subtitle: index }));
        if (!mediaKey || !itemId) return;
        if (index === null) {
            setLastSubtitleSelection(mediaKey, 'off');
            return;
        }
        const stream = subtitleStreams[index];
        if (!stream) return;
        setLastSubtitleSelection(mediaKey, {
            language: stream.Language ?? null,
            index: stream.Index ?? index,
            itemId,
            isForced: stream.IsForced ?? false,
            isHearingImpaired: stream.IsHearingImpaired ?? false,
        });
    };

    return {
        audioStreams,
        subtitleStreams,
        audioIndex,
        subtitleIndex,
        selectAudio,
        selectSubtitle,
        trackSelection,
    };
}
