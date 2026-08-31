import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { BackKeyInterceptContext, buildLayer, useStackDispatch } from './LayerStackProvider';
import type { Layer, NavigateMode } from './types';

export const LayerContext = createContext<Layer | null>(null);
export const LayerActiveContext = createContext(true);
export const LayerScrollContext = createContext(false);

/** Whether this layer is the top of the stack (visible and interactive). */
export function useLayerActive() {
    return useContext(LayerActiveContext);
}

function useCurrentLayer(): Layer {
    const layer = useContext(LayerContext);
    if (!layer) throw new Error('Router hooks must be used within a rendered layer');
    return layer;
}

export function useNavigate() {
    const dispatch = useStackDispatch();

    return useCallback(
        (to: string | -1, options?: { mode?: NavigateMode }) => {
            if (to === -1) {
                dispatch({ type: 'POP' });
                return;
            }

            switch (options?.mode ?? 'push') {
                case 'replace':
                    dispatch({ type: 'REPLACE', layer: buildLayer(to) });
                    break;
                case 'reset':
                    dispatch({ type: 'RESET', to });
                    break;
                default:
                    dispatch({ type: 'PUSH', layer: buildLayer(to) });
            }
        },
        [dispatch]
    );
}

export function useLocation() {
    const layer = useCurrentLayer();
    return useMemo(() => ({ pathname: layer.pathname, search: layer.search }), [layer]);
}

export function useParams<T extends Record<string, string | undefined>>(): T {
    return useCurrentLayer().params as T;
}

/**
 * Uniquely identifies the layer instance a component is rendered in
 */
export function useLayerId(): string {
    return useCurrentLayer().id;
}

export function useSearchParams(): [URLSearchParams] {
    const layer = useCurrentLayer();
    const searchParams = useMemo(() => new URLSearchParams(layer.search), [layer.search]);
    return [searchParams];
}

export function useBackKeyIntercept(handler?: () => boolean) {
    const isActive = useLayerActive();
    const setIntercept = useContext(BackKeyInterceptContext);

    useEffect(() => {
        if (!isActive || !handler) return;
        setIntercept(handler);
        return () => setIntercept(null);
    }, [isActive, handler, setIntercept]);
}
