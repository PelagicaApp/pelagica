import { useEffect, useState } from 'react';
import { Check, ChevronRight, Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
    BUILT_IN_PRESET_IDS,
    DEFAULT_SLEEP_FADE_DURATION_MINUTES,
    clampSleepFadeDurationMinutes,
    createCustomPresetSelection,
    createDefaultCustomPreset,
    type BuiltInEqualizerPresetId,
    type CustomEqualizerPreset,
    type EqualizerBand,
    type EqualizerSelection,
} from './presets';
import { BUILT_IN_PRESET_ICONS, CUSTOM_PRESET_ICON } from './presetIcons';
import CustomPresetEditor from './CustomPresetEditor';
import SleepModePanel from './SleepModePanel';

interface EqualizerPopoverProps {
    preset: EqualizerSelection;
    onPresetChange: (preset: EqualizerSelection) => void;
    customPresets: CustomEqualizerPreset[];
    onSaveCustomPreset: (preset: CustomEqualizerPreset) => void;
    onDeleteCustomPreset: (id: string) => void;
    onPreviewBandsChange: (bands: EqualizerBand[] | null) => void;
    sleepFadeEnabled: boolean;
    onStartSleepFade: (minutes: number) => void;
    onStopSleepFade: () => void;
    sleepFadeDurationMinutes: number;
    sleepFadeStartedAt: number | null;
    isPlaying: boolean;
    equalizerAvailable: boolean;
    className?: string;
}

type EditorState =
    | { mode: 'create'; preset: CustomEqualizerPreset }
    | { mode: 'edit'; preset: CustomEqualizerPreset };

const EqualizerPopover = ({
    preset,
    onPresetChange,
    customPresets,
    onSaveCustomPreset,
    onDeleteCustomPreset,
    onPreviewBandsChange,
    sleepFadeEnabled,
    onStartSleepFade,
    onStopSleepFade,
    sleepFadeDurationMinutes,
    sleepFadeStartedAt,
    isPlaying,
    equalizerAvailable,
    className,
}: EqualizerPopoverProps) => {
    const { t } = useTranslation('player');
    const [editorState, setEditorState] = useState<EditorState | null>(null);
    const [sleepPanelOpen, setSleepPanelOpen] = useState(false);
    const [sleepDraftMinutes, setSleepDraftMinutes] = useState(DEFAULT_SLEEP_FADE_DURATION_MINUTES);

    const isSleepRunning = preset === 'sleep' && sleepFadeEnabled;
    const isActive = preset !== 'flat' || sleepFadeEnabled;

    useEffect(() => {
        if (!editorState) {
            onPreviewBandsChange(null);
            return;
        }

        onPreviewBandsChange(editorState.preset.bands);
    }, [editorState, onPreviewBandsChange]);

    const closeAll = () => {
        setEditorState(null);
        setSleepPanelOpen(false);
        onPreviewBandsChange(null);
    };

    const openSleepPanel = () => {
        setEditorState(null);
        setSleepDraftMinutes(sleepFadeDurationMinutes);
        setSleepPanelOpen(true);
    };

    const handleBuiltInPresetClick = (id: BuiltInEqualizerPresetId) => {
        if (id === 'sleep') {
            openSleepPanel();
            return;
        }

        if (sleepFadeEnabled) {
            onStopSleepFade();
        }
        onPresetChange(id);
    };

    const handleSaveEditor = () => {
        if (!editorState) return;
        if (sleepFadeEnabled) {
            onStopSleepFade();
        }
        onSaveCustomPreset(editorState.preset);
        onPresetChange(createCustomPresetSelection(editorState.preset.id));
        closeAll();
    };

    const handleStartSleepFade = () => {
        const minutes = clampSleepFadeDurationMinutes(sleepDraftMinutes);
        setSleepDraftMinutes(minutes);
        onStartSleepFade(minutes);
    };

    return (
        <Popover
            onOpenChange={(open) => {
                if (!open) closeAll();
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'cursor-pointer',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                        className
                    )}
                    aria-label={t('equalizer')}
                    title={t('equalizer')}
                >
                    <SlidersHorizontal />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                side="top"
                sideOffset={8}
                className="z-300 w-72 max-h-[min(70vh,28rem)] overflow-y-auto p-3"
            >
                {editorState ? (
                    <CustomPresetEditor
                        preset={editorState.preset}
                        onChange={(nextPreset) =>
                            setEditorState({ mode: editorState.mode, preset: nextPreset })
                        }
                        onSave={handleSaveEditor}
                        onCancel={closeAll}
                    />
                ) : sleepPanelOpen ? (
                    <SleepModePanel
                        durationMinutes={sleepDraftMinutes}
                        activeDurationMinutes={sleepFadeDurationMinutes}
                        isRunning={isSleepRunning}
                        sleepFadeStartedAt={sleepFadeStartedAt}
                        isPlaying={isPlaying}
                        onDurationChange={setSleepDraftMinutes}
                        onStart={handleStartSleepFade}
                        onStop={onStopSleepFade}
                        onBack={() => setSleepPanelOpen(false)}
                    />
                ) : (
                    <>
                        <p className="mb-2 text-sm font-medium">{t('equalizer')}</p>
                        <ul className="space-y-0.5">
                            {BUILT_IN_PRESET_IDS.map((id) => {
                                const Icon = BUILT_IN_PRESET_ICONS[id];
                                const isSelected = preset === id;
                                const isSleep = id === 'sleep';

                                return (
                                    <li key={id}>
                                        <button
                                            type="button"
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                                                isSelected && 'bg-accent'
                                            )}
                                            onClick={() => handleBuiltInPresetClick(id)}
                                        >
                                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                                            <span className="flex-1 text-left">
                                                {t(`equalizerPresets.${id}`)}
                                            </span>
                                            {isSleep ? (
                                                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                                            ) : (
                                                <Check
                                                    className={cn(
                                                        'size-4 shrink-0',
                                                        isSelected ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {customPresets.length > 0 && (
                            <div className="mt-3 border-t pt-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    {t('customPresets')}
                                </p>
                                <ul className="space-y-0.5">
                                    {customPresets.map((customPreset) => {
                                        const selection = createCustomPresetSelection(
                                            customPreset.id
                                        );
                                        const isSelected = preset === selection;
                                        const Icon = CUSTOM_PRESET_ICON;

                                        return (
                                            <li key={customPreset.id}>
                                                <div
                                                    className={cn(
                                                        'flex items-center gap-1 rounded-md pr-1 transition-colors hover:bg-accent',
                                                        isSelected && 'bg-accent'
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm"
                                                        onClick={() => {
                                                            if (sleepFadeEnabled) {
                                                                onStopSleepFade();
                                                            }
                                                            onPresetChange(selection);
                                                        }}
                                                    >
                                                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                                                        <span className="truncate text-left">
                                                            {customPreset.name}
                                                        </span>
                                                        <Check
                                                            className={cn(
                                                                'ml-auto size-4 shrink-0',
                                                                isSelected
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0'
                                                            )}
                                                        />
                                                    </button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="shrink-0"
                                                        aria-label={t('customPresetEdit')}
                                                        onClick={() =>
                                                            setEditorState({
                                                                mode: 'edit',
                                                                preset: {
                                                                    ...customPreset,
                                                                    bands: customPreset.bands.map(
                                                                        (band) => ({ ...band })
                                                                    ),
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                                        aria-label={t('customPresetDelete')}
                                                        onClick={() =>
                                                            onDeleteCustomPreset(customPreset.id)
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() =>
                                setEditorState({
                                    mode: 'create',
                                    preset: createDefaultCustomPreset(t('customPresetDefaultName')),
                                })
                            }
                        >
                            <Plus className="size-4" />
                            {t('customPresetNew')}
                        </Button>

                        {!equalizerAvailable && (
                            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                                {t('equalizerUnavailable')}
                            </p>
                        )}
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default EqualizerPopover;
