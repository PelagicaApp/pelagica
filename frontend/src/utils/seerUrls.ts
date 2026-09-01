import type { SeerrMediaType } from '@pelagica/core';
import { getSeerrItemBackdropUrl, getSeerrItemPosterUrl } from '@pelagica/core';

export { getSeerrItemBackdropUrl, getSeerrItemPosterUrl };

export interface SeerrItemUrlParams {
    seerrUrl: string;
    tmdbId: number;
    mediaType: SeerrMediaType;
}

export function getSeerrItemUrl({ seerrUrl, tmdbId, mediaType }: SeerrItemUrlParams): string {
    return `${seerrUrl.replace(/\/$/, '')}/${mediaType}/${tmdbId}`;
}
