import { useEffect } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import type {
    UseFocusableConfig,
    UseFocusableResult,
} from '@noriginmedia/norigin-spatial-navigation';
import { useLayerActive } from './hooks';

export interface LayerFocusableConfig<P> extends UseFocusableConfig<P> {
    focusOnHover?: boolean;
}

/**
 * Wraps norigin's useFocusable so elements in a hidden (non-top) layer stop participating in spatial navigation.
 */
export function useLayerFocusable<P, E extends HTMLElement = HTMLElement>(
    config?: LayerFocusableConfig<P>
): UseFocusableResult<E> {
    const isLayerActive = useLayerActive();
    const focusable = (config?.focusable ?? true) && isLayerActive;
    const focusOnHover = config?.focusOnHover ?? false;

    const result = useFocusable<P, E>({ ...config, focusable });
    const { ref, focusSelf } = result;

    useEffect(() => {
        const element = ref.current;
        if (!element || !focusable || !focusOnHover) return;

        const handleMouseEnter = () => focusSelf();

        element.addEventListener('mouseenter', handleMouseEnter);
        return () => element.removeEventListener('mouseenter', handleMouseEnter);
    }, [ref, focusable, focusOnHover, focusSelf]);

    return result;
}
