import { memo } from 'react';
import FocusableCard from '../FocusableCard';
import { cn } from '../../lib/utils';
import { FOCUS_RING_LARGE } from '../../lib/focus-styles';
import { useTranslation } from 'react-i18next';

type MoreCardType = 'poster' | 'vertical';

interface MoreCardProps {
    to: string;
    type: MoreCardType;
    className?: string;
    autoFocus?: boolean;
}

const MoreCard = memo(function MoreCard({ to, type, className, autoFocus }: MoreCardProps) {
    const { t } = useTranslation('home');

    return (
        <FocusableCard to={to} className={cn(className ? className : 'w-60')} autoFocus={autoFocus}>
            {(focused) => (
                <div
                    className={cn(
                        'w-full relative overflow-hidden rounded-md border border-border bg-muted/50',
                        focused && FOCUS_RING_LARGE,
                        type === 'poster' ? 'aspect-2/3' : 'aspect-video'
                    )}
                >
                    <div className="w-full h-full flex items-center justify-center rounded-md px-3">
                        <span className="text-xl font-medium text-center line-clamp-2">
                            {t('more')}
                        </span>
                    </div>
                    <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                </div>
            )}
        </FocusableCard>
    );
});

export default MoreCard;
