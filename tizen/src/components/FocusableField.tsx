import { useEffect } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { cn } from '@/lib/utils';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';

const FocusableField = ({
    autoFocus,
    icon,
    className,
    focusKey,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & {
    autoFocus?: boolean;
    icon?: ReactNode;
    focusKey?: string;
}) => {
    const { ref, focused, focusSelf } = useFocusable<object, HTMLInputElement>({
        focusKey,
        onEnterPress: () => ref.current?.focus(),
        onBlur: () => ref.current?.blur(),
    });

    useEffect(() => {
        if (autoFocus) focusSelf();
    }, [autoFocus, focusSelf]);

    useScrollIntoViewOnFocus(ref, focused);

    return (
        <div className="relative w-full">
            {icon && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
                    {icon}
                </span>
            )}
            <input
                ref={ref}
                className={cn(
                    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none scroll-m-3',
                    icon && 'pl-9',
                    focused && 'ring-4 ring-ring ring-offset-4 ring-offset-background',
                    className
                )}
                {...props}
            />
        </div>
    );
};

export default FocusableField;
