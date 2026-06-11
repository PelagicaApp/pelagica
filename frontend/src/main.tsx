import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import { SearchProvider } from './context/SearchProvider.tsx';
import { SearchCommand } from './components/SearchCommand.tsx';
import { KeyboardShortcuts } from './components/KeyboardShortcuts.tsx';
import { MusicPlaybackProvider } from './context/MusicPlaybackProvider.tsx';
import PelagicaThemeLoader from './components/PelagicaThemeProvider.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import StatsConsentModal from './components/StatsConsentModal.tsx';

import './index.css';
import './theme.css';
import './i18n.ts';
import { ScrollToTop } from './components/ScrollToTop.tsx';

const HomePage = lazy(() => import('./pages/Home/HomePage.tsx'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage.tsx'));
const LibraryPage = lazy(() => import('./pages/Library/LibraryPage.tsx'));
const ItemPage = lazy(() => import('./pages/Item/ItemPage.tsx'));
const PersonPage = lazy(() => import('./pages/Person/PersonPage.tsx'));
const PlayerPage = lazy(() => import('./pages/Player/PlayerPage.tsx'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage.tsx'));
const SearchPage = lazy(() => import('./pages/Search/SearchPage.tsx'));
const ThemeBrowserPage = lazy(() => import('./pages/ThemeBrowser/ThemeBrowserPage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage.tsx'));
const PhotoViewerPage = lazy(() => import('./pages/PhotoViewer/PhotoViewerPage.tsx'));
const MusicLayout = lazy(() => import('./pages/Music/MusicLayout.tsx'));
const MusicMainContent = lazy(() => import('./pages/Music/MusicMainContent.tsx'));
const MusicAlbumView = lazy(() => import('./pages/Music/MusicAlbumView.tsx'));
const MusicPlaylistView = lazy(() => import('./pages/Music/MusicPlaylistView.tsx'));
const MusicArtistView = lazy(() => import('./pages/Music/MusicArtistView.tsx'));

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <MusicPlaybackProvider>
                <SearchProvider>
                    <BrowserRouter>
                        <ScrollToTop />
                        <KeyboardShortcuts />
                        <SearchCommand />
                        <PelagicaThemeLoader />
                        <Toaster />
                        <StatsConsentModal />
                        <Suspense fallback={null}>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/library" element={<LibraryPage />} />
                                <Route path="/item/:itemId" element={<ItemPage />} />
                                <Route path="/person/:itemId" element={<PersonPage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/play/:itemId" element={<PlayerPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/browse-themes" element={<ThemeBrowserPage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="/photo/:itemId" element={<PhotoViewerPage />} />
                                <Route path="/music" element={<MusicLayout />}>
                                    <Route index element={<MusicMainContent />} />
                                    <Route path="album/:itemId" element={<MusicAlbumView />} />
                                    <Route
                                        path="playlist/:itemId"
                                        element={<MusicPlaylistView />}
                                    />
                                    <Route path="artist/:itemId" element={<MusicArtistView />} />
                                </Route>
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </Suspense>
                    </BrowserRouter>
                </SearchProvider>
            </MusicPlaybackProvider>
        </ThemeProvider>
    </QueryClientProvider>
);
