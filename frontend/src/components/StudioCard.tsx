import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/components/theme-provider';
import { useStudiosBackendAvailable, type StudioSummary } from '@/hooks/api/useStudiosApi';
import { getEffectiveTheme } from '@/utils/effectiveTheme';
import { getStudioImageUrl, getThumbUrl } from '@/utils/jellyfinUrls';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

const DARK_THEME_LOGO_COLORS = ['ffffff', 'bababa'] as const;
const LIGHT_THEME_LOGO_COLORS = ['171717', '595959'] as const;

interface StudioCardProps {
    studio: StudioSummary;
    className?: string;
}

const StudioCard = ({ studio, className }: StudioCardProps) => {
    const { data: backendAvailable, isLoading: checkingBackend } = useStudiosBackendAvailable();
    const { theme } = useTheme();

    const [monoColor, monoColor2] =
        getEffectiveTheme(theme) === 'dark' ? DARK_THEME_LOGO_COLORS : LIGHT_THEME_LOGO_COLORS;

    const sources = useMemo(() => {
        const urls: string[] = [];
        if (backendAvailable) urls.push(getStudioImageUrl(studio.name, monoColor, monoColor2));
        urls.push(getThumbUrl(studio.id, { maxHeight: 300 }, undefined, 90));
        return urls;
    }, [backendAvailable, studio.name, studio.id, monoColor, monoColor2]);

    const [sourceIndex, setSourceIndex] = useState(0);
    const src = sourceIndex < sources.length ? sources[sourceIndex] : undefined;

    return (
        <Link to={`/item/${studio.id}`} className={`group ${className ?? ''}`}>
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                {checkingBackend ? (
                    <Skeleton className="w-full h-full rounded-md" />
                ) : !src ? (
                    <div className="w-full h-full flex items-center justify-center rounded-md px-3">
                        <span className="text-sm font-medium text-muted-foreground text-center line-clamp-2">
                            {studio.name}
                        </span>
                    </div>
                ) : (
                    <img
                        src={src}
                        alt={studio.name || 'No Name'}
                        className="w-full h-full object-contain p-6 rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                        onError={() => setSourceIndex((i) => i + 1)}
                    />
                )}
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
            </div>
        </Link>
    );
};

export default StudioCard;
