import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import HomePage from './pages/Home/HomePage.tsx';
import LoginPage from './pages/Login/LoginPage.tsx';

import './index.css';
import './theme.css';
import './i18n.ts';
import LibraryPage from './pages/Library/LibraryPage.tsx';
import { SearchProvider } from './context/SearchProvider.tsx';
import { SearchCommand } from './components/SearchCommand.tsx';
import { KeyboardShortcuts } from './components/KeyboardShortcuts.tsx';
import ItemPage from './pages/Item/ItemPage.tsx';
import NotFoundPage from './pages/NotFound/NotFoundPage.tsx';
import PlayerPage from './pages/Player/PlayerPage.tsx';
import PersonPage from './pages/Person/PersonPage.tsx';
import { MusicPlaybackProvider } from './context/MusicPlaybackProvider.tsx';
import SettingsPage from './pages/Settings/SettingsPage.tsx';
import SearchPage from './pages/Search/SearchPage.tsx';
import PelagicaThemeLoader from './components/PelagicaThemeProvider.tsx';
import ThemeBrowserPage from './pages/ThemeBroser/ThemeBrowserPage.tsx';
import { Toaster } from './components/ui/sonner.tsx';
import { SidebarBrowserProvider } from './context/SidebarBrowserContext.tsx';
import StatsConsentModal from './components/StatsConsentModal.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <MusicPlaybackProvider>
                <SearchProvider>
                    <BrowserRouter>
                        <SidebarBrowserProvider>
                            <KeyboardShortcuts />
                            <SearchCommand />
                            <PelagicaThemeLoader />
                            <Toaster />
                            <StatsConsentModal />
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
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </SidebarBrowserProvider>
                    </BrowserRouter>
                </SearchProvider>
            </MusicPlaybackProvider>
        </ThemeProvider>
    </QueryClientProvider>
);
