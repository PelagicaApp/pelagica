import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';

const IDENTIFIABLE_KINDS: BaseItemKind[] = ['Movie', 'Series'];

export const isIdentifiable = (kind: BaseItemKind): boolean => {
    return IDENTIFIABLE_KINDS.includes(kind);
};
