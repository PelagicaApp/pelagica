import { forwardRef, type ComponentProps, type MouseEvent } from 'react';
import { interceptExternalLinkClick } from '@/utils/desktopApp';

export const ExternalAnchor = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>(
    ({ href, onClick, target = '_blank', rel = 'noopener noreferrer', ...props }, ref) => {
        return (
            <a
                href={href}
                target={target}
                rel={rel}
                ref={ref}
                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                    onClick?.(event);
                    if (href && interceptExternalLinkClick(href)) {
                        event.preventDefault();
                    }
                }}
                {...props}
            />
        );
    }
);
ExternalAnchor.displayName = 'ExternalAnchor';
