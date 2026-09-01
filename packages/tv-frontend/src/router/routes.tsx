import { lazy } from 'react';
import type { RouteDef } from './types';

const LoginPage = lazy(() => import('@/routes/Login'));
const HomePage = lazy(() => import('@/routes/Home'));
const LibraryPage = lazy(() => import('@/routes/Library'));
const LibraryDetailPage = lazy(() => import('@/routes/LibraryDetail'));
const MovieDetailPage = lazy(() => import('@/routes/MovieDetail'));
const SeriesDetailPage = lazy(() => import('@/routes/SeriesDetail'));
const BoxSetDetailPage = lazy(() => import('@/routes/BoxSetDetail'));
const GenreDetailPage = lazy(() => import('@/routes/GenreDetail'));
const StudiosPage = lazy(() => import('@/routes/Studios'));
const StudioDetailPage = lazy(() => import('@/routes/StudioDetail'));
const PlayerPage = lazy(() => import('@/routes/Player'));
const SettingsPage = lazy(() => import('@/routes/Settings'));
const SearchPage = lazy(() => import('@/routes/Search'));
const SeerrItemPage = lazy(() => import('@/routes/SeerrItem'));

export const routes: RouteDef[] = [
    { pattern: '/login', component: LoginPage, chrome: 'none' },
    { pattern: '/player/:itemId', component: PlayerPage, chrome: 'none' },
    { pattern: '/', component: HomePage, chrome: 'shell', activeItem: 'home' },
    { pattern: '/settings', component: SettingsPage, chrome: 'shell', activeItem: 'settings' },
    { pattern: '/library', component: LibraryPage, chrome: 'shell', activeItem: 'library' },
    {
        pattern: '/library/:libraryId',
        component: LibraryDetailPage,
        chrome: 'shell',
        activeItem: 'library',
    },
    { pattern: '/movie/:itemId', component: MovieDetailPage, chrome: 'shell' },
    { pattern: '/series/:itemId', component: SeriesDetailPage, chrome: 'shell' },
    { pattern: '/boxset/:itemId', component: BoxSetDetailPage, chrome: 'shell' },
    { pattern: '/genre/:genreId', component: GenreDetailPage, chrome: 'shell' },
    { pattern: '/studios', component: StudiosPage, chrome: 'shell' },
    { pattern: '/studio/:itemId', component: StudioDetailPage, chrome: 'shell' },
    { pattern: '/search', component: SearchPage, chrome: 'shell', activeItem: 'search' },
    { pattern: '/seerr/:mediaType/:tmdbId', component: SeerrItemPage, chrome: 'shell' },
];
