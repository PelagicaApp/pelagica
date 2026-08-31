import type { ComponentType } from 'react';

export type TopBarItem = 'home' | 'library' | 'search' | 'settings';

export function topBarFocusKey(item: TopBarItem, layerId: string): string {
    return `topbar-${layerId}-${item}`;
}

export interface RouteDef {
    pattern: string;
    component: ComponentType;
    chrome: 'shell' | 'none';
    activeItem?: TopBarItem;
}

export interface Layer {
    id: string;
    pathname: string;
    search: string;
    route: RouteDef;
    params: Record<string, string>;
}

export interface StackState {
    layers: Layer[];
}

export type StackAction =
    | { type: 'PUSH'; layer: Layer }
    | { type: 'REPLACE'; layer: Layer }
    | { type: 'POP' }
    | { type: 'RESET'; to: string };

/**
 * How a navigation affects the stack:
 * - `push`: adds a new layer on top.
 * - `replace`: swaps only the top layer
 * - `reset`: clears the whole stack down to just the new layer.
 */
export type NavigateMode = 'push' | 'replace' | 'reset';
