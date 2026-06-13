import type { ImageType } from '@jellyfin/sdk/lib/generated-client/models';

const TMDB_THUMBNAIL_SIZES: Partial<Record<ImageType, string>> = {
    Primary: 'w342',
    Backdrop: 'w780',
    Banner: 'w780',
    Art: 'w500',
    Logo: 'w300',
    Profile: 'w185',
    Thumb: 'w300',
    Chapter: 'w185',
    Disc: 'w342',
    Box: 'w342',
    BoxRear: 'w342',
    Screenshot: 'w300',
    Menu: 'w300',
};

export const getTmdbThumbnailUrl = (url: string, imageType: ImageType | undefined): string => {
    if (!url.includes('image.tmdb.org/t/p/') || !imageType) return url;
    const size = TMDB_THUMBNAIL_SIZES[imageType] ?? 'w500';
    return url.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
};
