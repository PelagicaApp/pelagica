import type { UseLiveTvChannelsOptions } from '../../hooks/api/useLiveTvChannels';

export type ChannelCategoryFilter =
    | 'all'
    | 'favorites'
    | 'movies'
    | 'series'
    | 'news'
    | 'kids'
    | 'sports';

export const ALL_CATEGORY_FILTERS: ChannelCategoryFilter[] = [
    'all',
    'favorites',
    'movies',
    'series',
    'news',
    'kids',
    'sports',
];

export const CATEGORY_FILTER_OPTIONS: Record<
    ChannelCategoryFilter,
    Partial<UseLiveTvChannelsOptions>
> = {
    all: {},
    favorites: { isFavorite: true },
    movies: { isMovie: true },
    series: { isSeries: true },
    news: { isNews: true },
    kids: { isKids: true },
    sports: { isSports: true },
};
