import { Outlet, useLocation } from 'react-router-dom';
import { useTvBackKey } from '@/lib/use-tv-back-key';
import TopBar, { type TopBarItem } from '../components/TopBar';

export function RootLayout() {
    useTvBackKey();
    const { pathname } = useLocation();

    let activeItem: TopBarItem | undefined;

    if (pathname === '/') {
        activeItem = 'home';
    } else if (pathname.startsWith('/library')) {
        activeItem = 'library';
    } else if (pathname.startsWith('/search')) {
        activeItem = 'search';
    } else if (pathname.startsWith('/settings')) {
        activeItem = 'settings';
    }

    return (
        <div className="flex min-h-svh flex-col">
            <TopBar activeItem={activeItem} />
            <main className="min-w-0 flex-1 p-6 pt-3">
                <Outlet />
            </main>
        </div>
    );
}
