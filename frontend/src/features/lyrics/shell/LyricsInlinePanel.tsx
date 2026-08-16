import { getPrimaryImageUrl } from '@pelagica/core';
import type { MusicPlaybackTrack } from '@/context/MusicPlaybackContext';
import type { ProcessedLyrics } from '../types';
import LyricsDisplay from '../display/LyricsDisplay';

interface LyricsInlinePanelProps {
    track: MusicPlaybackTrack;
    lyrics: ProcessedLyrics;
    currentTime: number;
    onLineClick: (startTicks: number) => void;
}

const LyricsInlinePanel = ({ track, lyrics, currentTime, onLineClick }: LyricsInlinePanelProps) => {
    const coverUrl = getPrimaryImageUrl(track.id, { width: 800, height: 800 });

    return (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden animate-in fade-in duration-300">
            <div
                className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-3xl"
                style={{ backgroundImage: `url(${coverUrl})` }}
            />
            <div className="relative min-h-0 flex-1">
                <LyricsDisplay
                    lyrics={lyrics}
                    currentTime={currentTime}
                    onLineClick={onLineClick}
                />
            </div>
        </div>
    );
};

export default LyricsInlinePanel;
