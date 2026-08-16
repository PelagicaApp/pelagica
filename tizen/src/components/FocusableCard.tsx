import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { getRememberedFocusedKey, rememberFocusedKey } from '@/lib/focus-memory';
import { useRowIdentity } from '@/lib/row-identity-context';

const FocusableCard = ({
    to,
    autoFocus,
    className,
    children,
}: {
    to: string;
    autoFocus?: boolean;
    className?: string;
    children: (focused: boolean) => ReactNode;
}) => {
    const { pathname } = useLocation();
    const rowIdentity = useRowIdentity();
    const cardFocusKey = `${rowIdentity}:${to}`;
    const { ref, focused, focusSelf } = useFocusable<object, HTMLAnchorElement>({
        focusKey: cardFocusKey,
        onEnterPress: () => ref.current?.click(),
        onFocus: () => rememberFocusedKey(pathname, cardFocusKey),
    });

    useEffect(() => {
        if (autoFocus || getRememberedFocusedKey(pathname) === cardFocusKey) focusSelf();
        // Only meant to run once on mount to establish initial focus.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useScrollIntoViewOnFocus(ref, focused);

    return (
        <Link ref={ref} to={to} className={cn('block shrink-0 scroll-m-3 outline-none', className)}>
            {children(focused)}
        </Link>
    );
};

export default FocusableCard;
