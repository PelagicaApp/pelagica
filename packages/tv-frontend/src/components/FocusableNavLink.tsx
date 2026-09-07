import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLayerFocusable } from '@/router/useLayerFocusable';
import { Link, useLocation } from '@/router';
import type { NavigateMode } from '@/router';
import { cn } from '@/lib/utils';
import { FOCUS_RING_COMPACT } from '@/lib/focus-styles';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { Button } from '@/components/ui/button';

const FocusableNavLink = ({
    to,
    focusKey,
    mode = 'reset',
    active,
    className,
    children,
}: {
    to: string;
    focusKey?: string;
    mode?: NavigateMode;
    active: boolean;
    className?: string;
    children: ReactNode;
}) => {
    const location = useLocation();
    const { ref, focused, focusSelf } = useLayerFocusable<object, HTMLAnchorElement>({
        focusKey,
        focusOnHover: true,
        onEnterPress: () => ref.current?.click(),
    });

    const isActive = location.pathname === to;
    useEffect(() => {
        if (isActive) focusSelf();
    }, [isActive, focusSelf]);

    useScrollIntoViewOnFocus(ref, focused);

    return (
        <Button
            render={<Link ref={ref} to={to} mode={mode} />}
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
