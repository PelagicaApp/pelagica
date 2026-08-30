import { randomUUID } from '@pelagica/core';

export const EQUALIZER_PRESET_STORAGE_KEY = 'music_equalizer_preset';
export const SLEEP_FADE_STORAGE_KEY = 'music_sleep_fade_enabled';
export const SLEEP_FADE_DURATION_STORAGE_KEY = 'music_sleep_fade_duration_minutes';
export const CUSTOM_PRESETS_STORAGE_KEY = 'music_equalizer_custom_presets';

export const DEFAULT_SLEEP_FADE_DURATION_MINUTES = 20;
export const MIN_SLEEP_FADE_DURATION_MINUTES = 1;
export const MAX_SLEEP_FADE_DURATION_MINUTES = 180;
export const CUSTOM_PRESET_GAIN_MIN = -12;
export const CUSTOM_PRESET_GAIN_MAX = 12;

export type BuiltInEqualizerPresetId = 'flat' | 'bassBoost' | 'vocalBoost' | 'podcast' | 'sleep';

/** @deprecated Use BuiltInEqualizerPresetId or EqualizerSelection */
export type EqualizerPresetId = BuiltInEqualizerPresetId;

export type EqualizerSelection = BuiltInEqualizerPresetId | `custom:${string}`;

export interface CustomEqualizerPreset {
    id: string;
    name: string;
    bands: EqualizerBand[];
}

export interface EqualizerBand {
    type: BiquadFilterType;
    frequency: number;
    gain: number;
    Q?: number;
}

export const BUILT_IN_PRESET_IDS: BuiltInEqualizerPresetId[] = [
    'flat',
    'bassBoost',
    'vocalBoost',
    'podcast',
    'sleep',
];

/** @deprecated Use BUILT_IN_PRESET_IDS */
export const EQUALIZER_PRESET_IDS = BUILT_IN_PRESET_IDS;

export const EQUALIZER_BAND_TEMPLATE: EqualizerBand[] = [
    { type: 'lowshelf', frequency: 80, gain: 0, Q: 0.7 },
    { type: 'peaking', frequency: 250, gain: 0, Q: 1 },
    { type: 'peaking', frequency: 1000, gain: 0, Q: 1 },
    { type: 'peaking', frequency: 4000, gain: 0, Q: 1 },
    { type: 'highshelf', frequency: 12000, gain: 0, Q: 0.7 },
];

export const EQUALIZER_BAND_KEYS = ['bass', 'lowMid', 'mid', 'highMid', 'treble'] as const;
export type EqualizerBandKey = (typeof EQUALIZER_BAND_KEYS)[number];

const FLAT_BANDS: EqualizerBand[] = EQUALIZER_BAND_TEMPLATE.map((band) => ({ ...band }));

export const EQUALIZER_PRESETS: Record<BuiltInEqualizerPresetId, EqualizerBand[]> = {
    flat: FLAT_BANDS,
    bassBoost: [
        { type: 'lowshelf', frequency: 80, gain: 5, Q: 0.7 },
        { type: 'peaking', frequency: 200, gain: 2, Q: 1 },
        { type: 'peaking', frequency: 1000, gain: 0, Q: 1 },
        { type: 'peaking', frequency: 4000, gain: 0, Q: 1 },
        { type: 'highshelf', frequency: 12000, gain: 0, Q: 0.7 },
    ],
    vocalBoost: [
        { type: 'lowshelf', frequency: 80, gain: 0, Q: 0.7 },
        { type: 'peaking', frequency: 250, gain: 0, Q: 1 },
        { type: 'peaking', frequency: 1000, gain: 4, Q: 1.2 },
        { type: 'peaking', frequency: 3000, gain: 3, Q: 1.2 },
        { type: 'highshelf', frequency: 8000, gain: -2, Q: 0.7 },
    ],
    podcast: [
        { type: 'highpass', frequency: 100, gain: 0, Q: 0.7 },
        { type: 'lowshelf', frequency: 100, gain: -3, Q: 0.7 },
        { type: 'peaking', frequency: 2500, gain: 5, Q: 1.2 },
        { type: 'peaking', frequency: 5000, gain: 2, Q: 1 },
        { type: 'highshelf', frequency: 12000, gain: 0, Q: 0.7 },
    ],
    sleep: [
        { type: 'lowshelf', frequency: 80, gain: -3, Q: 0.7 },
        { type: 'peaking', frequency: 250, gain: 0, Q: 1 },
        { type: 'peaking', frequency: 1000, gain: 0, Q: 1 },
        { type: 'peaking', frequency: 4000, gain: 0, Q: 1 },
        { type: 'highshelf', frequency: 12000, gain: -5, Q: 0.7 },
    ],
};

export const SLEEP_FADE_HIGH_SHELF_START = -5;
export const SLEEP_FADE_HIGH_SHELF_END = -12;
export const SLEEP_FADE_LOWPASS_START = 12000;
export const SLEEP_FADE_LOWPASS_END = 2500;

export function isBuiltInPresetId(value: string): value is BuiltInEqualizerPresetId {
    return BUILT_IN_PRESET_IDS.includes(value as BuiltInEqualizerPresetId);
}

/** @deprecated Use isBuiltInPresetId */
export function isEqualizerPresetId(value: string): value is BuiltInEqualizerPresetId {
    return isBuiltInPresetId(value);
}

export function isCustomPresetSelection(value: string): value is `custom:${string}` {
    return value.startsWith('custom:');
}

export function getCustomPresetId(selection: EqualizerSelection): string | null {
    if (!isCustomPresetSelection(selection)) return null;
    return selection.slice('custom:'.length);
}

export function createDefaultCustomPreset(name: string): CustomEqualizerPreset {
    return {
        id: randomUUID(),
        name,
        bands: EQUALIZER_BAND_TEMPLATE.map((band) => ({ ...band })),
    };
}

export function createCustomPresetSelection(id: string): EqualizerSelection {
    return `custom:${id}`;
}

export function loadStoredCustomPresets(): CustomEqualizerPreset[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored) as CustomEqualizerPreset[];
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (preset) =>
                typeof preset.id === 'string' &&
                typeof preset.name === 'string' &&
                Array.isArray(preset.bands) &&
                preset.bands.length === EQUALIZER_BAND_TEMPLATE.length
        );
    } catch {
        return [];
    }
}

export function saveCustomPresets(presets: CustomEqualizerPreset[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

export function resolvePresetBands(
    selection: EqualizerSelection,
    customPresets: CustomEqualizerPreset[]
): EqualizerBand[] {
    if (isBuiltInPresetId(selection)) {
        return EQUALIZER_PRESETS[selection];
    }

    const customId = getCustomPresetId(selection);
    const custom = customPresets.find((preset) => preset.id === customId);
    return custom?.bands ?? EQUALIZER_PRESETS.flat;
}

export function loadStoredPreset(
    customPresets: CustomEqualizerPreset[] = loadStoredCustomPresets()
): EqualizerSelection {
    if (typeof window === 'undefined') return 'flat';

    const stored = localStorage.getItem(EQUALIZER_PRESET_STORAGE_KEY);
    if (!stored) return 'flat';

    if (isBuiltInPresetId(stored)) return stored;

    if (isCustomPresetSelection(stored)) {
        const customId = getCustomPresetId(stored);
        if (customPresets.some((preset) => preset.id === customId)) {
            return stored;
        }
    }

    return 'flat';
}

export function loadStoredSleepFadeEnabled(): boolean {
    if (typeof window === 'undefined') return false;

    return localStorage.getItem(SLEEP_FADE_STORAGE_KEY) === 'true';
}

export function clampSleepFadeDurationMinutes(minutes: number): number {
    return Math.min(
        MAX_SLEEP_FADE_DURATION_MINUTES,
        Math.max(MIN_SLEEP_FADE_DURATION_MINUTES, Math.round(minutes))
    );
}

export function loadStoredSleepFadeDurationMinutes(): number {
    if (typeof window === 'undefined') return DEFAULT_SLEEP_FADE_DURATION_MINUTES;

    const stored = localStorage.getItem(SLEEP_FADE_DURATION_STORAGE_KEY);
    const parsed = stored ? Number(stored) : DEFAULT_SLEEP_FADE_DURATION_MINUTES;

    return Number.isFinite(parsed)
        ? clampSleepFadeDurationMinutes(parsed)
        : DEFAULT_SLEEP_FADE_DURATION_MINUTES;
}

export function sleepFadeMinutesToMs(minutes: number): number {
    return clampSleepFadeDurationMinutes(minutes) * 60 * 1000;
}

export function lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}
