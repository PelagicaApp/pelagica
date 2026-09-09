import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
import { AudioLines, ChevronDown, Subtitles } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TrackSelectionState } from '@/hooks/useTrackSelection';
import { subtitleStreamRank } from '@/utils/trackMemory';

const AUDIO_CODEC_LABELS: Record<string, string> = {
    ac3: 'AC-3',
    eac3: 'E-AC-3',
    truehd: 'TrueHD',
    dts: 'DTS',
    dca: 'DTS',
    aac: 'AAC',
    flac: 'FLAC',
    mp2: 'MP2',
    mp3: 'MP3',
    opus: 'Opus',
    vorbis: 'Vorbis',
    alac: 'ALAC',
};

const SUBTITLE_CODEC_LABELS: Record<string, string> = {
    srt: 'SUBRIP',
    subrip: 'SUBRIP',
    pgs: 'PGS',
    pgssub: 'PGS',
    hdmv_pgs_subtitle: 'PGS',
    ass: 'ASS',
    ssa: 'SSA',
    vtt: 'VTT',
    webvtt: 'VTT',
    dvdsub: 'VOBSUB',
    dvbsub: 'DVBSUB',
    mov_text: 'MOV_TEXT',
};

function audioCodecLabel(codec: string | null | undefined): string | null {
    if (!codec) return null;
    const normalized = codec.toLowerCase();
    if (normalized.startsWith('pcm')) return 'PCM';
    return AUDIO_CODEC_LABELS[normalized] ?? codec.toUpperCase();
}

function subtitleCodecLabel(codec: string | null | undefined): string | null {
    if (!codec) return null;
    return SUBTITLE_CODEC_LABELS[codec.toLowerCase()] ?? codec.toUpperCase();
}

function shortLanguage(stream: MediaStream): string {
    return (stream.Language || 'UNK').slice(0, 3).toUpperCase();
}

function fullLanguage(stream: MediaStream, locale: string, unknownLabel: string): string {
    const code = stream.Language;
    if (!code) return unknownLabel;
    try {
        const name = new Intl.DisplayNames([locale], { type: 'language' }).of(code.toLowerCase());
        if (name && name.toLowerCase() !== code.toLowerCase()) return name;
    } catch {
        // unrecognized language code
    }
    return code.toUpperCase();
}

function channelLayoutLabel(stream: MediaStream): string | null {
    const layout = stream.ChannelLayout?.split('(')[0]?.trim().toLowerCase();
    if (layout === 'mono') return '1.0';
    if (layout === 'stereo') return '2.0';
    if (layout) return layout.toUpperCase();
    switch (stream.Channels) {
        case 1:
            return '1.0';
        case 2:
            return '2.0';
        case 6:
            return '5.1';
        case 7:
            return '6.1';
        case 8:
            return '7.1';
        default:
            return stream.Channels ? `${stream.Channels}.0` : null;
    }
}

const TrackButton = ({
    icon,
    label,
    disabled,
    ariaLabel,
    ...props
}: {
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    ariaLabel: string;
} & React.ComponentProps<typeof Button>) => (
    <Button
        variant="secondary"
        className="w-min font-normal"
        disabled={disabled}
        aria-label={ariaLabel}
        {...props}
    >
        {icon}
        {label}
        {!disabled && <ChevronDown className="h-4 w-4 opacity-60" />}
    </Button>
);

const AudioTrackSelector = ({ selection }: { selection: TrackSelectionState }) => {
    const { t, i18n } = useTranslation('item');
    const { audioStreams, audioIndex, selectAudio } = selection;

    const selectedStream =
        audioStreams.find((s) => s.Index === audioIndex) ?? audioStreams[0] ?? null;

    const closedLabel = selectedStream
        ? [shortLanguage(selectedStream), channelLayoutLabel(selectedStream)]
              .filter(Boolean)
              .join(' - ')
        : t('track_na');

    if (audioStreams.length <= 1) {
        return (
            <TrackButton
                icon={<AudioLines />}
                label={closedLabel}
                disabled
                ariaLabel={t('select_audio_track')}
            />
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <TrackButton
                    icon={<AudioLines />}
                    label={closedLabel}
                    ariaLabel={t('select_audio_track')}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-96">
                <DropdownMenuLabel>{t('audio')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={audioIndex !== null ? String(audioIndex) : ''}
                    onValueChange={(value) => selectAudio(Number.parseInt(value, 10))}
                >
                    {audioStreams.map((stream) => {
                        const parts = [
                            fullLanguage(stream, i18n.language, t('track_unknown')),
                            [audioCodecLabel(stream.Codec), stream.ChannelLayout?.toUpperCase()]
                                .filter(Boolean)
                                .join(' '),
                            stream.Profile,
                        ].filter(Boolean);
                        return (
                            <DropdownMenuRadioItem key={stream.Index} value={String(stream.Index)}>
                                <div className="flex flex-col items-start gap-0.5 min-w-0">
                                    <span>{parts.join(' - ')}</span>
                                    {stream.Title && (
                                        <span className="text-xs text-muted-foreground whitespace-normal">
                                            {stream.Title}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuRadioItem>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const SubtitleTrackSelector = ({ selection }: { selection: TrackSelectionState }) => {
    const { t, i18n } = useTranslation('item');
    const { subtitleStreams, subtitleIndex, selectSubtitle } = selection;

    const selectedStream = subtitleIndex !== null ? subtitleStreams[subtitleIndex] : null;

    // Alphabetical display order (externals mixed in); values keep the original positions
    const sortedEntries = subtitleStreams
        .map((stream, position) => ({
            stream,
            position,
            language: fullLanguage(stream, i18n.language, t('track_unknown')),
        }))
        .sort(
            (a, b) =>
                a.language.localeCompare(b.language, i18n.language) ||
                subtitleStreamRank(a.stream) - subtitleStreamRank(b.stream)
        );

    const closedLabel =
        subtitleStreams.length === 0
            ? t('track_na')
            : selectedStream
              ? `${shortLanguage(selectedStream)}${selectedStream.IsForced ? ` - ${t('track_forced')}` : ''}${selectedStream.IsHearingImpaired ? ` ${t('track_hi')}` : ''}`
              : t('track_disabled');

    if (subtitleStreams.length === 0) {
        return (
            <TrackButton
                icon={<Subtitles />}
                label={closedLabel}
                disabled
                ariaLabel={t('select_subtitle_track')}
            />
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <TrackButton
                    icon={<Subtitles />}
                    label={closedLabel}
                    ariaLabel={t('select_subtitle_track')}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-96">
                <DropdownMenuLabel>{t('subtitles')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={subtitleIndex !== null ? String(subtitleIndex) : 'off'}
                    onValueChange={(value) =>
                        selectSubtitle(value === 'off' ? null : Number.parseInt(value, 10))
                    }
                >
                    <DropdownMenuRadioItem value="off">{t('track_disabled')}</DropdownMenuRadioItem>
                    {sortedEntries.map(({ stream, position, language }) => {
                        const parts = [
                            language,
                            stream.IsHearingImpaired ? t('track_hi') : null,
                            stream.IsForced ? t('track_forced') : null,
                            subtitleCodecLabel(stream.Codec),
                        ].filter(Boolean);
                        return (
                            <DropdownMenuRadioItem key={position} value={String(position)}>
                                <div className="flex flex-col items-start gap-0.5 min-w-0">
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span>{parts.join(' - ')}</span>
                                        {stream.IsExternal && (
                                            <Badge variant="secondary">{t('track_external')}</Badge>
                                        )}
                                    </span>
                                    {stream.Title && (
                                        <span className="text-xs text-muted-foreground whitespace-normal">
                                            {stream.Title}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuRadioItem>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const TrackSelectors = ({ selection }: { selection: TrackSelectionState }) => (
    <>
        <AudioTrackSelector selection={selection} />
        <SubtitleTrackSelector selection={selection} />
    </>
);

export default TrackSelectors;
