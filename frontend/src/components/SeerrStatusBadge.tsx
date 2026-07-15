import { useTranslation } from 'react-i18next';
import { Clock, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeerrMediaStatus, type SeerrMediaInfo } from '@/api/seerr/types';

interface SeerrStatusBadgeProps {
    mediaInfo?: SeerrMediaInfo;
    className?: string;
}

const SeerrStatusBadge = ({ mediaInfo, className }: SeerrStatusBadgeProps) => {
    const { t } = useTranslation('seerr');
    const status = mediaInfo?.status;

    const baseClassName =
        'flex items-center justify-center w-6 h-6 rounded-full shadow-sm [&>svg]:size-3.5';

    if (status === SeerrMediaStatus.AVAILABLE) {
        return null;
    }

    if (status === SeerrMediaStatus.PARTIALLY_AVAILABLE) {
        const title = t('seerr_status_partially_available');
        return (
            <div className={cn(baseClassName, 'bg-blue-500 text-white', className)} title={title}>
                <Download aria-label={title} className="[clip-path:inset(0_0_0_50%)]" />
            </div>
        );
    }

    if (status === SeerrMediaStatus.PENDING || status === SeerrMediaStatus.PROCESSING) {
        const title =
            status === SeerrMediaStatus.PENDING
                ? t('seerr_status_pending')
                : t('seerr_status_processing');
        return (
            <div className={cn(baseClassName, 'bg-amber-500 text-white', className)} title={title}>
                <Clock aria-label={title} />
            </div>
        );
    }

    return (
        <div
            className={cn(baseClassName, 'bg-muted text-muted-foreground border', className)}
            title={t('seerr_status_unavailable')}
        >
            <Download aria-label={t('seerr_status_unavailable')} />
        </div>
    );
};

export default SeerrStatusBadge;
