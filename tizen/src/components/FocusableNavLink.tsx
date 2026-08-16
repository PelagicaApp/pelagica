import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FOCUS_RING_COMPACT } from '@/lib/focus-styles';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { Button } from '@/components/ui/button';

const FocusableNavLink = ({
    to,
    active,
    className,
    children,
}: {
    to: string;
    active: boolean;
    className?: string;
    children: ReactNode;
}) => {
    const location = useLocation();
    const { ref, focused, focusSelf } = useFocusable<object, HTMLAnchorElement>({
        onEnterPress: () => ref.current?.click(),
    });

    const isActive = location.pathname === to;
    useEffect(() => {
        if (isActive) focusSelf();
    }, [isActive, focusSelf]);

    useScrollIntoViewOnFocus(ref, focused);

    return (
        <Button
            render={<Link ref={ref} to={to} />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className={cn(
                'scroll-mt-20',
                focused && FOCUS_RING_COMPACT,
                active && 'bg-accent text-accent-foreground',
                className
            )}
        >
            {children}
        </Button>
    );
};

export default FocusableNavLink;
