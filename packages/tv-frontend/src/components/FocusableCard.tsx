import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLayerFocusable } from '@/router/useLayerFocusable';
import { Link, useLayerActive, useLayerId, useLocation } from '@/router';
import type { NavigateMode } from '@/router';
import { cn } from '@/lib/utils';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { getRememberedFocusedKey, rememberFocusedKey } from '@/lib/focus-memory';
import { useRowIdentity } from '@/lib/row-identity-context';

const FocusableCard = ({
    to,
    mode,
    autoFocus,
    className,
    children,
}: {
    to: string;
    mode?: NavigateMode;
    autoFocus?: boolean;
    className?: string;
    children: (focused: boolean) => ReactNode;
}) => {
    const { pathname } = useLocation();
    const layerId = useLayerId();
    const isLayerActive = useLayerActive();
    const rowIdentity = useRowIdentity();
    const cardFocusKey = `${layerId}:${rowIdentity}:${to}`;
    const { ref, focused, focusSelf } = useLayerFocusable<object, HTMLAnchorElement>({
        focusKey: cardFocusKey,
        focusOnHover: true,
        onEnterPress: () => ref.current?.click(),
        onFocus: () => rememberFocusedKey(pathname, cardFocusKey),
    });

    useEffect(() => {
        if (!isLayerActive) return;
        if (autoFocus || getRememberedFocusedKey(pathname) === cardFocusKey) focusSelf();
        // Reruns whenever this layer is the top again, so returning to a screen restores the card that was focused before navigating away.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLayerActive]);

    useScrollIntoViewOnFocus(ref, focused);

    return (
        <Link
            ref={ref}
            to={to}
            mode={mode}
            className={cn('block shrink-0 scroll-mx-6 scroll-my-3 outline-none', className)}
        >
            {children(focused)}
        </Link>
    );
};

export default FocusableCard;
