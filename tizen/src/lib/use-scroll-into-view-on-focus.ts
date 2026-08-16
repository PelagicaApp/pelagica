import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useScrollIntoViewOnFocus(ref: RefObject<HTMLElement | null>, focused: boolean) {
    useEffect(() => {
        if (focused) {
            ref.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            });
        }
    }, [focused, ref]);
}
