import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface OverviewProps {
    text: string;
    lines?: number;
    className?: string;
}

const Overview = ({ text, lines = 3, className }: OverviewProps) => {
    const { t } = useTranslation('item');
    const ref = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);

    const [prevText, setPrevText] = useState(text);
    const [prevLines, setPrevLines] = useState(lines);
    if (text !== prevText || lines !== prevLines) {
        setPrevText(text);
        setPrevLines(lines);
        setExpanded(false);
    }

    // Measure if text is clamped on mount and when props changes
    useLayoutEffect(() => {
        const el = ref.current;
        if (el && !expanded) setIsClamped(el.scrollHeight > el.clientHeight);
    }, [text, lines, expanded]);

    if (text.trim().length === 0) return null;

    return (
        <div className="max-w-3xl mt-2">
            <p
                ref={ref}
                style={
                    !expanded
                        ? {
                              display: '-webkit-box',
                              WebkitLineClamp: lines,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                          }
                        : undefined
                }
                className={`text-base sm:text-lg text-foreground/90 leading-relaxed font-normal ${className ?? ''}`}
            >
                {text}
            </p>
            {isClamped && (
                <button
                    onClick={() => setExpanded((p) => !p)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 mt-1.5"
                >
                    {expanded ? t('show_less') : t('show_more')}
                </button>
            )}
        </div>
    );
};

export default Overview;
