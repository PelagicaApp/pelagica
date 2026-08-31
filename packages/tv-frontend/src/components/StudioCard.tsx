import { buildTmdbImageUrl, type StudioSummary } from '@pelagica/core';
import FocusableCard from './FocusableCard';
import { cn } from '../lib/utils';
import { FOCUS_RING_LARGE } from '../lib/focus-styles';
import { memo, useState } from 'react';
import { useStudioLogo } from '../hooks/useStudioLogo';
import { getItemLink } from '../lib/getItemLink';

const DARK_THEME_LOGO_COLORS = ['ffffff', 'bababa'] as const;

interface StudioCardProps {
    studio: StudioSummary;
    className?: string;
    autoFocus?: boolean;
}

const StudioCard = memo(function StudioCard({ studio, className, autoFocus }: StudioCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const { logoPath, isLoading } = useStudioLogo(String(studio.name));

    const showFallback = imageFailed || (!isLoading && !logoPath);

    const src = logoPath
        ? buildTmdbImageUrl(logoPath, {
              mono: true,
              color: DARK_THEME_LOGO_COLORS[0],
              color2: DARK_THEME_LOGO_COLORS[1],
              size: 'w300',
          })
        : undefined;

    return (
        <FocusableCard
            to={getItemLink('Studio', studio.id)}
            className={cn(className ? className : 'w-60')}
            autoFocus={autoFocus}
        >
            {(focused) => (
                <div
                    className={cn(
                        'aspect-video w-full relative overflow-hidden rounded-md border border-border bg-muted',
                        focused && FOCUS_RING_LARGE
                    )}
                >
                    {showFallback ? (
                        <div className="w-full h-full flex items-center justify-center rounded-md px-3">
                            <span className="text-xl font-medium text-center line-clamp-2">
                                {studio.name}
                            </span>
                        </div>
                    ) : src ? (
                        <img
                            src={src}
                            alt={studio.name || 'No Name'}
                            className="w-full h-full object-contain p-6 rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                            onError={() => setImageFailed(true)}
                        />
                    ) : null}
                    <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                </div>
            )}
        </FocusableCard>
    );
});

export default StudioCard;
