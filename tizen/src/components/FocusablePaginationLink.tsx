import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { cn } from '@/lib/utils';
import { FOCUS_RING_COMPACT } from '@/lib/focus-styles';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const VARIANT_COMPONENT = {
    link: PaginationLink,
    previous: PaginationPrevious,
    next: PaginationNext,
};

const FocusablePaginationLink = ({
    variant = 'link',
    className,
    ...props
}: React.ComponentProps<typeof PaginationLink> & {
    variant?: keyof typeof VARIANT_COMPONENT;
    text?: string;
}) => {
    const { ref, focused } = useFocusable<object, HTMLAnchorElement>({
        onEnterPress: () => ref.current?.click(),
    });

    useScrollIntoViewOnFocus(ref, focused);

    const Component = VARIANT_COMPONENT[variant];

    return (
        <Component
            ref={ref}
            className={cn('scroll-m-3', focused && FOCUS_RING_COMPACT, className)}
            {...props}
        />
    );
};

export default FocusablePaginationLink;
