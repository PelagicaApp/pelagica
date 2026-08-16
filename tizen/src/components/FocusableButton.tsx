import { useEffect } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { cn } from '@/lib/utils';
import { FOCUS_RING_COMPACT, FOCUS_RING_LARGE } from '@/lib/focus-styles';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { Button } from '@/components/ui/button';

const COMPACT_SIZES = new Set(['sm', 'xs', 'icon', 'icon-sm', 'icon-xs', 'icon-lg']);

const FocusableButton = ({
    autoFocus,
    className,
    size = 'default',
    floating = false,
    focusKey,
    ...props
}: React.ComponentProps<typeof Button> & {
    autoFocus?: boolean;
    floating?: boolean;
    focusKey?: string;
}) => {
    const { ref, focused, focusSelf } = useFocusable<object, HTMLButtonElement>({
        focusKey,
        onEnterPress: () => ref.current?.click(),
    });

    useEffect(() => {
        if (autoFocus) focusSelf();
    }, [autoFocus, focusSelf]);

    useScrollIntoViewOnFocus(ref, focused);

    const compact = COMPACT_SIZES.has(String(size));

    if (floating) {
        return (
            <div
                className={cn(
                    'inline-flex rounded-xl border-4 border-transparent p-0.5 transition-colors',
                    focused && 'border-ring'
                )}
            >
                <Button ref={ref} size={size} className={className} {...props} />
            </div>
        );
    }

    return (
        <Button
            ref={ref}
            size={size}
            className={cn(focused && (compact ? FOCUS_RING_COMPACT : FOCUS_RING_LARGE), className)}
            {...props}
        />
    );
};

export default FocusableButton;
