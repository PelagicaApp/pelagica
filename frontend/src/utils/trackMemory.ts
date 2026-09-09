import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
import { iso6392 } from 'iso-639-2';
import { isImageBasedSubtitle } from '@/utils/subtitleStreams';

// Keyed by series id (episodes) or item id (movies) so selections carry across episodes
const STORAGE_KEY = 'lastTracksByMedia';

export interface LastAudioSelection {
    language: string | null;
    /** Absolute MediaStream.Index, exact match only for the same item */
    index: number;
    itemId: string;
}

export interface LastSubtitleTrack {
    language: string | null;
    /** Absolute MediaStream.Index, exact match only for the same item */
    index: number;
    itemId: string;
    isForced?: boolean;
    isHearingImpaired?: boolean;
}

export type LastSubtitleSelection = LastSubtitleTrack | 'off';

type MediaTrackState = {
    audio?: LastAudioSelection;
    subtitle?: LastSubtitleSelection;
};

type TrackMemoryMap = Record<string, MediaTrackState>;

function getMap(): TrackMemoryMap {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
        return {};
    }
}

function saveMap(map: TrackMemoryMap): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Memory key for an item: the series for episodes, the item itself otherwise */
export function mediaTrackKey(item: Pick<BaseItemDto, 'Id' | 'SeriesId'>): string {
    return item.SeriesId ?? item.Id ?? '';
}

export function getLastAudioSelection(
    mediaKey: string | null | undefined
): LastAudioSelection | null {
    if (!mediaKey) return null;
    return getMap()[mediaKey]?.audio ?? null;
}

export function getLastSubtitleSelection(
    mediaKey: string | null | undefined
): LastSubtitleSelection | null {
    if (!mediaKey) return null;
    return getMap()[mediaKey]?.subtitle ?? null;
}

export function setLastAudioSelection(mediaKey: string, selection: LastAudioSelection): void {
    const map = getMap();
    map[mediaKey] = { ...map[mediaKey], audio: selection };
    saveMap(map);
}

export function setLastSubtitleSelection(mediaKey: string, selection: LastSubtitleSelection): void {
    const map = getMap();
    map[mediaKey] = { ...map[mediaKey], subtitle: selection };
    saveMap(map);
}

/** Normalize ISO 639-2 bibliographic codes (fre, ger, ...) to terminological ones (fra, deu, ...) */
function normalizeLanguage(code: string | null | undefined): string | null {
    if (!code) return null;
    const lower = code.toLowerCase();
    const entry = iso6392.find((l) => l.iso6392T === lower || l.iso6392B === lower);
    return entry?.iso6392T ?? lower;
}

function sameLanguage(a: string | null | undefined, b: string | null | undefined): boolean {
    const normalizedA = normalizeLanguage(a);
    return normalizedA !== null && normalizedA === normalizeLanguage(b);
}

/**
 * Preference order within a language, most significant first:
 * embedded before external, then normal < HI < forced, then text before image-based
 */
export function subtitleStreamRank(stream: MediaStream): number {
    const flagTier =
        stream.IsForced && stream.IsHearingImpaired
            ? 3
            : stream.IsForced
              ? 2
              : stream.IsHearingImpaired
                ? 1
                : 0;
    return (stream.IsExternal ? 8 : 0) + flagTier * 2 + (isImageBasedSubtitle(stream) ? 1 : 0);
}

function bestSubtitlePosition(
    subtitleStreams: MediaStream[],
    predicate: (stream: MediaStream) => boolean
): number {
    let best = -1;
    let bestRank = Number.POSITIVE_INFINITY;
    subtitleStreams.forEach((stream, position) => {
        if (!predicate(stream)) return;
        const rank = subtitleStreamRank(stream);
        if (rank < bestRank) {
            best = position;
            bestRank = rank;
        }
    });
    return best;
}

/**
 * Default audio track: last used for this movie/show, then the account's
 * preferred language, then the media default. Returns the absolute
 * MediaStream.Index, or null when there are no audio streams.
 */
export function resolveDefaultAudioIndex(
    audioStreams: MediaStream[],
    mediaKey: string | null | undefined,
    itemId: string | null | undefined,
    preferredLanguage: string | null | undefined
): number | null {
    if (audioStreams.length === 0) return null;

    const last = getLastAudioSelection(mediaKey);
    if (last) {
        if (itemId && last.itemId === itemId) {
            const exact = audioStreams.find((s) => s.Index === last.index);
            if (exact?.Index != null) return exact.Index;
        }
        const byLanguage = audioStreams.find((s) => sameLanguage(s.Language, last.language));
        if (byLanguage?.Index != null) return byLanguage.Index;
    }

    const preferred = audioStreams.find((s) => sameLanguage(s.Language, preferredLanguage));
    if (preferred?.Index != null) return preferred.Index;

    const fallback =
        audioStreams.find((s) => s.IsDefault) ??
        audioStreams.find((s) => s.Index === 1) ??
        audioStreams[0];
    return fallback?.Index ?? null;
}

/**
 * Default subtitle track: last used for this movie/show (including "off"),
 * then the account's preferred language, otherwise disabled. Language matches
 * pick the best-ranked track (see subtitleStreamRank). Returns the position
 * within subtitleStreams, or null for disabled.
 */
export function resolveDefaultSubtitleIndex(
    subtitleStreams: MediaStream[],
    mediaKey: string | null | undefined,
    itemId: string | null | undefined,
    preferredLanguage: string | null | undefined
): number | null {
    if (subtitleStreams.length === 0) return null;

    const last = getLastSubtitleSelection(mediaKey);
    if (last === 'off') return null;
    if (last) {
        if (itemId && last.itemId === itemId) {
            const exact = subtitleStreams.findIndex((s) => s.Index === last.index);
            if (exact >= 0) return exact;
        }
        if (last.language) {
            const sameFlags = bestSubtitlePosition(
                subtitleStreams,
                (s) =>
                    sameLanguage(s.Language, last.language) &&
                    !!s.IsForced === !!last.isForced &&
                    !!s.IsHearingImpaired === !!last.isHearingImpaired
            );
            if (sameFlags >= 0) return sameFlags;
            const anyOfLanguage = bestSubtitlePosition(subtitleStreams, (s) =>
                sameLanguage(s.Language, last.language)
            );
            if (anyOfLanguage >= 0) return anyOfLanguage;
        }
    }

    if (preferredLanguage) {
        const preferred = bestSubtitlePosition(subtitleStreams, (s) =>
            sameLanguage(s.Language, preferredLanguage)
        );
        if (preferred >= 0) return preferred;
    }

    return null;
}
