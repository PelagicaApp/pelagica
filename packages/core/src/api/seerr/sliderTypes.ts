import {
    encodeSeerrQueryValue,
    titleSlider,
    todayIsoDate,
    type SeerrDiscoverSlider,
    type SeerrSliderResolveResult,
} from './sliderResolve.ts';

/** Vanilla Seerr `DiscoverSliderType` (1–21). Unknown numbers must not crash the app. */
export const SeerrDiscoverSliderType = {
    RECENTLY_ADDED: 1,
    RECENT_REQUESTS: 2,
    PLEX_WATCHLIST: 3,
    TRENDING: 4,
    POPULAR_MOVIES: 5,
    MOVIE_GENRES: 6,
    UPCOMING_MOVIES: 7,
    STUDIOS: 8,
    POPULAR_TV: 9,
    TV_GENRES: 10,
    UPCOMING_TV: 11,
    NETWORKS: 12,
    TMDB_MOVIE_KEYWORD: 13,
    TMDB_MOVIE_GENRE: 14,
    TMDB_TV_KEYWORD: 15,
    TMDB_TV_GENRE: 16,
    TMDB_SEARCH: 17,
    TMDB_STUDIO: 18,
    TMDB_NETWORK: 19,
    TMDB_MOVIE_STREAMING_SERVICES: 20,
    TMDB_TV_STREAMING_SERVICES: 21,
} as const;

export type SeerrDiscoverSliderType =
    (typeof SeerrDiscoverSliderType)[keyof typeof SeerrDiscoverSliderType];

/** Built-in home variants already covered by `SEERR_DISCOVER_VARIANTS`. */
export const SEERR_VARIANT_SLIDER_TYPES: readonly number[] = [
    SeerrDiscoverSliderType.TRENDING,
    SeerrDiscoverSliderType.POPULAR_MOVIES,
    SeerrDiscoverSliderType.POPULAR_TV,
];

const BUILTIN_TITLES: Partial<Record<number, string>> = {
    [SeerrDiscoverSliderType.TRENDING]: 'Trending',
    [SeerrDiscoverSliderType.POPULAR_MOVIES]: 'Popular Movies',
    [SeerrDiscoverSliderType.UPCOMING_MOVIES]: 'Upcoming Movies',
    [SeerrDiscoverSliderType.POPULAR_TV]: 'Popular Series',
    [SeerrDiscoverSliderType.UPCOMING_TV]: 'Upcoming Series',
};

const skip = { kind: 'skip' } as const;
const unknown = { kind: 'unknown' } as const;

function titles(
    slider: SeerrDiscoverSlider,
    path: string,
    linkPath: string,
    query?: Record<string, string>
): SeerrSliderResolveResult {
    return titleSlider(
        slider,
        path,
        linkPath,
        BUILTIN_TITLES[slider.type] || 'Discover',
        query
    );
}

/**
 * Seerr-owned types only. Returns `unknown` for numbers Seerr does not define yet
 * so a future Seerr type can be added without crashing the home screen.
 */
export function resolveSeerrDiscoverSlider(
    slider: SeerrDiscoverSlider
): SeerrSliderResolveResult {
    if (!slider.enabled) return skip;

    const data = slider.data?.trim() || '';
    const T = SeerrDiscoverSliderType;

    switch (slider.type) {
        case T.RECENTLY_ADDED:
        case T.RECENT_REQUESTS:
        case T.PLEX_WATCHLIST:
        case T.MOVIE_GENRES:
        case T.STUDIOS:
        case T.TV_GENRES:
        case T.NETWORKS:
            return skip;
        case T.TRENDING:
            return titles(slider, 'discover/trending', '/discover/trending');
        case T.POPULAR_MOVIES:
            return titles(slider, 'discover/movies', '/discover/movies');
        case T.UPCOMING_MOVIES: {
            const date = todayIsoDate();
            return titles(slider, 'discover/movies', `/discover/movies?primaryReleaseDateGte=${date}`, {
                primaryReleaseDateGte: date,
            });
        }
        case T.POPULAR_TV:
            return titles(slider, 'discover/tv', '/discover/tv');
        case T.UPCOMING_TV: {
            const date = todayIsoDate();
            return titles(slider, 'discover/tv', `/discover/tv?firstAirDateGte=${date}`, {
                firstAirDateGte: date,
            });
        }
        case T.TMDB_MOVIE_KEYWORD:
            if (!data) return skip;
            return titles(slider, 'discover/movies', `/discover/movies?keywords=${data}`, {
                keywords: data,
            });
        case T.TMDB_TV_KEYWORD:
            if (!data) return skip;
            return titles(slider, 'discover/tv', `/discover/tv?keywords=${data}`, { keywords: data });
        case T.TMDB_MOVIE_GENRE:
            if (!data) return skip;
            return titles(slider, 'discover/movies', `/discover/movies?genre=${data}`, {
                genre: data,
            });
        case T.TMDB_TV_GENRE:
            if (!data) return skip;
            return titles(slider, 'discover/tv', `/discover/tv?genre=${data}`, { genre: data });
        case T.TMDB_STUDIO:
            if (!data) return skip;
            return titles(
                slider,
                `discover/movies/studio/${data}`,
                `/discover/movies/studio/${data}`
            );
        case T.TMDB_NETWORK:
            if (!data) return skip;
            return titles(slider, `discover/tv/network/${data}`, `/discover/tv/network/${data}`);
        case T.TMDB_SEARCH:
            if (!data) return skip;
            return titles(slider, 'search', `/search?query=${encodeSeerrQueryValue(data)}`, {
                query: data,
            });
        case T.TMDB_MOVIE_STREAMING_SERVICES: {
            const [watchRegion, watchProviders] = data.split(',');
            if (!watchRegion || !watchProviders) return skip;
            return titles(
                slider,
                'discover/movies',
                `/discover/movies?watchRegion=${watchRegion}&watchProviders=${watchProviders}`,
                { watchRegion, watchProviders }
            );
        }
        case T.TMDB_TV_STREAMING_SERVICES: {
            const [watchRegion, watchProviders] = data.split(',');
            if (!watchRegion || !watchProviders) return skip;
            return titles(
                slider,
                'discover/tv',
                `/discover/tv?watchRegion=${watchRegion}&watchProviders=${watchProviders}`,
                { watchRegion, watchProviders }
            );
        }
        default:
            return unknown;
    }
}
