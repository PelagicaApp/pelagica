import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPrimaryImageUrl } from '@pelagica/core';
import type { MusicPlaybackTrack } from '@/context/MusicPlaybackContext';
import type { ProcessedLyrics } from '../types';
import LyricsDisplay from '../display/LyricsDisplay';
import { useTranslation } from 'react-i18next';

interface LyricsExpandedPanelProps {
    track: MusicPlaybackTrack;
    lyrics: ProcessedLyrics;
    currentTime: number;
    onLineClick: (startTicks: number) => void;
    onClose: () => void;
    enabled?: boolean;
}

const LyricsExpandedPanel = ({
    track,
    lyrics,
    currentTime,
    onLineClick,
    onClose,
    enabled = true,
}: LyricsExpandedPanelProps) => {
    const { t } = useTranslation('player');
    const coverUrl = getPrimaryImageUrl(track.id, { width: 800, height: 800 });

    return (
        <div className="relative flex h-[calc(70vh-7rem)] flex-col overflow-hidden animate-in fade-in duration-300">
            <div
                className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 blur-2xl"
                style={{ backgroundImage: `url(${coverUrl})` }}
            />
            <div className="relative flex shrink-0 items-center gap-2 border-b border-border/50 px-3 py-2">
                <div className="min-w-0 flex-1 text-center">
                    <p className="truncate text-sm font-medium">{track.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={onClose}
                    aria-label={t('hideLyrics')}
                    title={t('hideLyrics')}
                >
                    <ChevronDown />
                </Button>
            </div>
            <div className="relative min-h-0 flex-1">
                <LyricsDisplay
                    key={enabled ? 'open' : 'closed'}
                    lyrics={lyrics}
                    currentTime={currentTime}
                    onLineClick={onLineClick}
                    enabled={enabled}
                />
            </div>
        </div>
    );
};

export default LyricsExpandedPanel;
