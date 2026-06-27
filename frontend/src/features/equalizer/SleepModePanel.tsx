import { ChevronLeft, MoonStar, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
    DEFAULT_SLEEP_FADE_DURATION_MINUTES,
    MAX_SLEEP_FADE_DURATION_MINUTES,
    MIN_SLEEP_FADE_DURATION_MINUTES,
    clampSleepFadeDurationMinutes,
    sleepFadeMinutesToMs,
} from './presets';
import { formatSleepFadeRemaining, useSleepFadeRemainingMs } from './sleepFadeTime';

interface SleepModePanelProps {
    durationMinutes: number;
    activeDurationMinutes: number;
    isRunning: boolean;
    sleepFadeStartedAt: number | null;
    isPlaying: boolean;
    onDurationChange: (minutes: number) => void;
    onStart: () => void;
    onStop: () => void;
    onBack: () => void;
}

const SleepModePanel = ({
    durationMinutes,
    activeDurationMinutes,
    isRunning,
    sleepFadeStartedAt,
    isPlaying,
    onDurationChange,
    onStart,
    onStop,
    onBack,
}: SleepModePanelProps) => {
    const { t } = useTranslation('player');
    const durationMs = sleepFadeMinutesToMs(isRunning ? activeDurationMinutes : durationMinutes);
    const remainingMs = useSleepFadeRemainingMs(sleepFadeStartedAt, durationMs, isRunning);
    const remainingLabel = remainingMs !== null ? formatSleepFadeRemaining(remainingMs) : null;
    const canStart = isPlaying;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={onBack}
                    aria-label={t('sleepFadeBack')}
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                    <MoonStar className="size-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm font-medium">{t('equalizerPresets.sleep')}</p>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">{t('sleepFadeDescription')}</p>

            <div className="space-y-2">
                <label htmlFor="sleep-fade-duration" className="text-sm font-medium">
                    {t('sleepFadeDuration')}
                </label>
                <div className="flex items-center gap-2">
                    <Input
                        id="sleep-fade-duration"
                        type="number"
                        min={MIN_SLEEP_FADE_DURATION_MINUTES}
                        max={MAX_SLEEP_FADE_DURATION_MINUTES}
                        value={durationMinutes}
                        disabled={isRunning}
                        onChange={(event) => {
                            const parsed = Number(event.target.value);
                            if (Number.isFinite(parsed)) {
                                onDurationChange(parsed);
                            }
                        }}
                        onBlur={(event) => {
                            const parsed = Number(event.target.value);
                            if (!Number.isFinite(parsed)) {
                                onDurationChange(DEFAULT_SLEEP_FADE_DURATION_MINUTES);
                                return;
                            }
                            onDurationChange(clampSleepFadeDurationMinutes(parsed));
                        }}
                        className="w-20"
                        aria-label={t('sleepFadeDuration')}
                    />
                    <span className="text-sm text-muted-foreground">
                        {t('sleepFadeDurationUnit')}
                    </span>
                    {isRunning && remainingLabel && (
                        <span
                            className="ml-auto tabular-nums text-sm font-medium text-primary"
                            aria-live="polite"
                            aria-label={t('sleepFadeRemaining', { time: remainingLabel })}
                        >
                            {remainingLabel}
                        </span>
                    )}
                    {isRunning ? (
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={onStop}
                            aria-label={t('sleepFadeStop')}
                            title={t('sleepFadeStop')}
                        >
                            <Square className="size-4" />
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="icon"
                            className="ml-auto shrink-0"
                            onClick={onStart}
                            disabled={!canStart}
                            aria-label={t('sleepFadeStart')}
                            title={
                                canStart ? t('sleepFadeStart') : t('sleepFadeStartRequiresPlayback')
                            }
                        >
                            <Play className="size-4" />
                        </Button>
                    )}
                </div>
                {!isRunning && !canStart && (
                    <p className="text-xs text-muted-foreground">
                        {t('sleepFadeStartRequiresPlayback')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default SleepModePanel;
