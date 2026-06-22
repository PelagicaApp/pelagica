import { Button } from '@/components/ui/button';
import { type ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { PageBackgroundProvider } from '@/context/PageBackgroundProvider';
import { usePageBackground } from '@/hooks/usePageBackground';
import MusicPlayerBar from '@/components/MusicPlayerBar';
import FullPageLoader from '@/components/FullPageLoader';
import { logout } from '@/api/logout';
import FullPageError from '@/components/FullPageError';
import { getSidebarState, saveSidebarState } from '../utils/localstorageSidebar';
import TopBar from '@/components/TopBar';
import { cn } from '../lib/utils';
import PageSidebar from '../components/PageSidebar';

type PageRenderContext = {
    showSidebar: boolean;
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
};
import { useQueryClient } from '@tanstack/react-query';

interface PageProps {
    children?: ReactNode | ((context: PageRenderContext) => ReactNode);
    title?: string;
    className?: string;
    containerClassName?: string;
    requiresAuth?: boolean;
    requireAdmin?: boolean;
    breadcrumbs?: React.ReactNode;
    bgItem?: React.ReactNode;
    showPlayerBar?: boolean;
    overlayHeader?: boolean;
    showHeader?: boolean;
    pagePadding?: boolean;
}

const isLoggedIn = () => Boolean(localStorage.getItem('jf_token'));

const DefaultPageBackground = () => (
    <div className="fixed inset-0 -z-30 bg-background">
        <div className="absolute inset-0 bg-muted/20" />
    </div>
);

const PageContent = ({
    children,
    title,
    className,
    containerClassName,
    requiresAuth = false,
    requireAdmin = false,
    overlayHeader = false,
    showHeader = true,
    pagePadding = true,
    breadcrumbs,
    bgItem,
    showPlayerBar = true,
}: PageProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { isLoading, isError, data: user } = useCurrentUser();
    const { background } = usePageBackground();
    const [showLoader, setShowLoader] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(() => getSidebarState());
    const [pageScrolled, setPageScrolled] = useState(false);
    const closesSidebarForRoute = location.pathname === '/' || location.pathname === '/search';

    useEffect(() => {
        if (title) document.title = title;
    }, [title]);

    useEffect(() => {
        if (requiresAuth && !isLoggedIn()) {
            navigate('/login', { replace: true });
        }
    }, [requiresAuth, navigate]);

    useEffect(() => {
        if (!isLoading) return;
        const t = setTimeout(() => setShowLoader(true), 600);
        return () => {
            clearTimeout(t);
            setShowLoader(false);
        };
    }, [isLoading]);

    useEffect(() => {
        if (!closesSidebarForRoute) return;
        saveSidebarState(false);
    }, [closesSidebarForRoute]);

    if (requiresAuth && isLoading && showLoader)
        return <FullPageLoader message="Loading user information..." />;

    if (requiresAuth && isError)
        return (
            <FullPageError
                title="Authentication Error"
                message="Failed to load user information."
                content={
                    <Button
                        onClick={() => {
                            logout(queryClient).then(() => {
                                navigate('/login', { replace: true });
                            });
                        }}
                    >
                        Return to login
                    </Button>
                }
            />
        );

    if (requiresAuth && !isLoggedIn()) return null;
    if (requiresAuth && !user) return null;

    if (requireAdmin && user && !user.Policy?.IsAdministrator)
        return (
            <FullPageError
                title="Access Denied"
                message="You do not have the necessary permissions to view this page."
                content={
                    <Button onClick={() => navigate('/', { replace: true })}>Return to home</Button>
                }
            />
        );

    const showSidebar = Boolean(user?.Id && isLoggedIn());

    const handleSidebarOpenChange = (open: boolean) => {
        setSidebarOpen(open);
        saveSidebarState(open);
    };

    const pageRenderContext: PageRenderContext = {
        showSidebar,
        sidebarOpen: closesSidebarForRoute ? false : (sidebarOpen ?? false),
        toggleSidebar: () => handleSidebarOpenChange(!(sidebarOpen ?? false)),
        setSidebarOpen: handleSidebarOpenChange,
    };

    return (
        <div
            className={`relative isolate flex min-h-dvh h-dvh w-full flex-col overflow-hidden bg-background ${containerClassName ?? ''}`}
        >
            <DefaultPageBackground />
            {background || bgItem}
            {showHeader && <TopBar overlay={overlayHeader} scrolled={pageScrolled} />}
            <div className="flex min-h-0 w-full flex-1 flex-row">
                {showSidebar && (
                    <PageSidebar
                        open={closesSidebarForRoute ? false : (sidebarOpen ?? false)}
                        onOpenChange={handleSidebarOpenChange}
                    />
                )}
                <div
                    className={cn(
                        'relative z-5 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground',
                        pagePadding && 'py-4 px-4 sm:px-12',
                        !overlayHeader && 'pt-18' // Topbar has height of 14 + 4 (padding) = 18
                    )}
                    onScroll={(event) => setPageScrolled(event.currentTarget.scrollTop > 20)}
                >
                    {breadcrumbs && (
                        <div className="flex items-center gap-2 mb-4">{breadcrumbs}</div>
                    )}
                    <main className={cn('min-w-0 flex-1', className)}>
                        {typeof children === 'function' ? children(pageRenderContext) : children}
                    </main>
                </div>
            </div>
            {showPlayerBar && <MusicPlayerBar />}
        </div>
    );
};

const Page = (props: PageProps) => (
    <PageBackgroundProvider>
        <PageContent {...props} />
    </PageBackgroundProvider>
);

export default Page;
