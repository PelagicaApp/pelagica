import type { LyricLine } from '@jellyfin/sdk/lib/generated-client/models';
import { cn } from '@/lib/utils';
import type { LyricLineState } from '../types';

interface StaticLinesProps {
    lines: LyricLine[];
}

const StaticLines = ({ lines }: StaticLinesProps) => {
    return (
        <div className="flex flex-col gap-4 px-4 py-6">
            {lines.map((line, index) => (
                <p
                    key={`${index}-${line.Text}`}
                    className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap"
                >
                    {line.Text}
                </p>
            ))}
        </div>
    );
};

export default StaticLines;

export function getLineState(index: number, activeIndex: number): LyricLineState {
    if (activeIndex < 0) {
        return 'future';
    }

    if (index < activeIndex) {
        return 'past';
    }

    if (index === activeIndex) {
        return 'active';
    }

    return 'future';
}

export function getLineClassName(state: LyricLineState): string {
    return cn(
        'w-full text-left transition-all duration-300 whitespace-pre-wrap',
        state === 'active' && 'text-xl font-semibold text-foreground scale-[1.02]',
        state === 'past' && 'text-base text-muted-foreground/45',
        state === 'future' && 'text-base text-muted-foreground/75',
    );
}
