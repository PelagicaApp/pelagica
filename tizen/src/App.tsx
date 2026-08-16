import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { RootLayout } from '@/routes/RootLayout';
import { RequireAuth } from '@/routes/RequireAuth';
import { ScrollToTop } from '@/components/ScrollToTop';
import { lazy } from 'react';

const LoginPage = lazy(() => import('./routes/Login'));
const HomePage = lazy(() => import('./routes/Home'));
const LibraryPage = lazy(() => import('./routes/Library'));
const LibraryDetailPage = lazy(() => import('./routes/LibraryDetail'));
const MovieDetailPage = lazy(() => import('./routes/MovieDetail'));
const SeriesDetailPage = lazy(() => import('./routes/SeriesDetail'));
const BoxSetDetailPage = lazy(() => import('./routes/BoxSetDetail'));
const GenreDetailPage = lazy(() => import('./routes/GenreDetail'));
const PlayerPage = lazy(() => import('./routes/Player'));
const SettingsPage = lazy(() => import('./routes/Settings'));
const SearchPage = lazy(() => import('./routes/Search'));

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter>
                <ScrollToTop />
                <Routes>
                    <Route path="login" element={<LoginPage />} />
                    <Route
                        path="player/:itemId"
                        element={
                            <RequireAuth>
                                <PlayerPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        element={
                            <RequireAuth>
                                <RootLayout />
                            </RequireAuth>
                        }
                    >
                        <Route index element={<HomePage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="library" element={<LibraryPage />} />
                        <Route path="library/:libraryId" element={<LibraryDetailPage />} />
                        <Route path="movie/:itemId" element={<MovieDetailPage />} />
                        <Route path="series/:itemId" element={<SeriesDetailPage />} />
                        <Route path="boxset/:itemId" element={<BoxSetDetailPage />} />
                        <Route path="genre/:genreId" element={<GenreDetailPage />} />
                        <Route path="search" element={<SearchPage />} />
                    </Route>
                </Routes>
            </HashRouter>
        </QueryClientProvider>
    );
}

export default App;
