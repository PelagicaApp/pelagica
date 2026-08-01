import { useTheme } from '@/components/theme-provider';
import type { StudioSummary } from '@/hooks/api/useStudiosApi';
import { getEffectiveTheme } from '@/utils/effectiveTheme';
import { getStudioImageUrl } from '@/utils/jellyfinUrls';
import { useState } from 'react';
import { Link } from 'react-router';

const DARK_THEME_LOGO_COLORS = ['ffffff', 'bababa'] as const;
const LIGHT_THEME_LOGO_COLORS = ['171717', '595959'] as const;

interface StudioCardProps {
    studio: StudioSummary;
    className?: string;
}

const StudioCard = ({ studio, className }: StudioCardProps) => {
    const { theme } = useTheme();
    const [imageFailed, setImageFailed] = useState(false);

    const [monoColor, monoColor2] =
        getEffectiveTheme(theme) === 'dark' ? DARK_THEME_LOGO_COLORS : LIGHT_THEME_LOGO_COLORS;

    const src = getStudioImageUrl(studio.name, monoColor, monoColor2);

    return (
        <Link to={`/studio/${studio.id}`} className={`group ${className ?? ''}`}>
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                {imageFailed ? (
                    <div className="w-full h-full flex items-center justify-center rounded-md px-3">
                        <span className="text-xl font-medium text-center line-clamp-2">
                            {studio.name}
                        </span>
                    </div>
                ) : (
                    <img
                        src={src}
                        alt={studio.name || 'No Name'}
                        className="w-full h-full object-contain p-6 rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                        onError={() => setImageFailed(true)}
                    />
                )}
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
            </div>
        </Link>
    );
};

export default StudioCard;
