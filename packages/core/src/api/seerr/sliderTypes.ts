import {
    encodeSeerrQueryValue,
    titleSlider,
    todayIsoDate,
    type SeerrDiscoverSlider,
    type SeerrSliderResolveResult,
} from './sliderResolve.ts';

/** Discover slider type numbers. Unknown values must not crash the app. */
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
    TRAKT_RECOMMENDATIONS: 22,
    TRAKT_WATCHLIST: 23,
    TRAKT_LIST: 24,
    TRAKT_HISTORY: 25,
    ANILIST_TRENDING: 26,
    ANILIST_SEASON: 27,
    ANILIST_WATCHING: 28,
    ANILIST_PLANNING: 29,
    ANILIST_COMPLETED: 30,
    ANILIST_LIST: 31,
    ANILIST_POPULAR: 32,
    ANILIST_TOP: 33,
    ANILIST_NEXT_SEASON: 34,
    MDBLIST_LIST: 35,
    SIMKL_TRENDING: 36,
    SIMKL_PLAN_TO_WATCH: 37,
    SIMKL_BEST_TV: 38,
    SIMKL_BEST_ANIME: 39,
    SIMKL_NEW_TV_PREMIERES: 40,
    SIMKL_UPCOMING_TV_PREMIERES: 41,
    SIMKL_NEW_ANIME_PREMIERES: 42,
    SIMKL_UPCOMING_ANIME_PREMIERES: 43,
    SIMKL_WATCHING: 44,
    SIMKL_ON_HOLD: 45,
    SIMKL_COMPLETED: 46,
    SIMKL_DROPPED: 47,
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
    [SeerrDiscoverSliderType.TRAKT_RECOMMENDATIONS]: 'Trakt Recommendations',
    [SeerrDiscoverSliderType.TRAKT_WATCHLIST]: 'Trakt Watchlist',
    [SeerrDiscoverSliderType.TRAKT_HISTORY]: 'Trakt History',
    [SeerrDiscoverSliderType.ANILIST_TRENDING]: 'AniList Trending',
    [SeerrDiscoverSliderType.ANILIST_SEASON]: 'AniList This Season',
    [SeerrDiscoverSliderType.ANILIST_WATCHING]: 'AniList Watching',
    [SeerrDiscoverSliderType.ANILIST_PLANNING]: 'AniList Planning',
    [SeerrDiscoverSliderType.ANILIST_COMPLETED]: 'AniList Completed',
    [SeerrDiscoverSliderType.ANILIST_POPULAR]: 'AniList Popular',
    [SeerrDiscoverSliderType.ANILIST_TOP]: 'AniList Top 100',
    [SeerrDiscoverSliderType.ANILIST_NEXT_SEASON]: 'AniList Next Season',
    [SeerrDiscoverSliderType.SIMKL_TRENDING]: 'Simkl Trending',
    [SeerrDiscoverSliderType.SIMKL_PLAN_TO_WATCH]: 'Simkl Plan to Watch',
    [SeerrDiscoverSliderType.SIMKL_WATCHING]: 'Simkl Watching',
    [SeerrDiscoverSliderType.SIMKL_ON_HOLD]: 'Simkl On Hold',
    [SeerrDiscoverSliderType.SIMKL_COMPLETED]: 'Simkl Completed',
    [SeerrDiscoverSliderType.SIMKL_DROPPED]: 'Simkl Dropped',
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
 * Maps a Discover slider to a title row. Returns `unknown` for numbers
 * nobody maps yet so a future type cannot crash the home screen.
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
        case T.SIMKL_BEST_TV:
        case T.SIMKL_BEST_ANIME:
        case T.SIMKL_NEW_TV_PREMIERES:
        case T.SIMKL_UPCOMING_TV_PREMIERES:
        case T.SIMKL_NEW_ANIME_PREMIERES:
        case T.SIMKL_UPCOMING_ANIME_PREMIERES:
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
        case T.TRAKT_RECOMMENDATIONS:
            return titles(slider, 'discover/trakt/recommendations', '/discover/trakt');
        case T.TRAKT_WATCHLIST:
            return titles(slider, 'discover/trakt/watchlist', '/discover/trakt?view=watchlist');
        case T.TRAKT_HISTORY:
            return titles(slider, 'discover/trakt/history', '/discover/trakt?view=history');
        case T.TRAKT_LIST:
            if (!data) return skip;
            return titles(
                slider,
                'discover/trakt/list',
                `/discover/trakt/list?url=${encodeSeerrQueryValue(data)}`,
                { url: data }
            );
        case T.ANILIST_TRENDING:
            return titles(slider, 'discover/anilist/trending', '/discover/anilist/trending');
        case T.ANILIST_SEASON:
            return titles(slider, 'discover/anilist/season', '/discover/anilist/season');
        case T.ANILIST_POPULAR:
            return titles(slider, 'discover/anilist/popular', '/discover/anilist/popular');
        case T.ANILIST_TOP:
            return titles(slider, 'discover/anilist/top', '/discover/anilist/top');
        case T.ANILIST_NEXT_SEASON:
            return titles(slider, 'discover/anilist/next-season', '/discover/anilist/next-season');
        case T.ANILIST_WATCHING:
            return titles(slider, 'discover/anilist/watching', '/discover/anilist/watching');
        case T.ANILIST_PLANNING:
            return titles(slider, 'discover/anilist/planning', '/discover/anilist/planning');
        case T.ANILIST_COMPLETED:
            return titles(slider, 'discover/anilist/completed', '/discover/anilist/completed');
        case T.ANILIST_LIST:
            if (!data) return skip;
            return titles(
                slider,
                'discover/anilist/list',
                `/discover/anilist/list?name=${encodeSeerrQueryValue(data)}`,
                { name: data }
            );
        case T.MDBLIST_LIST:
            if (!data) return skip;
            return titles(
                slider,
                'discover/mdblist/list',
                `/discover/mdblist/list?url=${encodeSeerrQueryValue(data)}`,
                { url: data }
            );
        case T.SIMKL_TRENDING:
            return titles(slider, 'discover/simkl/trending', '/discover/simkl?view=trending');
        case T.SIMKL_PLAN_TO_WATCH:
            return titles(slider, 'discover/simkl/library', '/discover/simkl?status=plantowatch', {
                status: 'plantowatch',
            });
        case T.SIMKL_WATCHING:
            return titles(slider, 'discover/simkl/library', '/discover/simkl?status=watching', {
                status: 'watching',
            });
        case T.SIMKL_ON_HOLD:
            return titles(slider, 'discover/simkl/library', '/discover/simkl?status=hold', {
                status: 'hold',
            });
        case T.SIMKL_COMPLETED:
            return titles(slider, 'discover/simkl/library', '/discover/simkl?status=completed', {
                status: 'completed',
            });
        case T.SIMKL_DROPPED:
            return titles(slider, 'discover/simkl/library', '/discover/simkl?status=dropped', {
                status: 'dropped',
            });
        default:
            return unknown;
    }
}
