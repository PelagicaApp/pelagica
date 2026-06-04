import { Button } from '@/components/ui/button';
import {
    SIDEBAR_WIDTH,
    SIDEBAR_WIDTH_BROWSE,
    SIDEBAR_WIDTH_BROWSE_MOBILE,
    SIDEBAR_WIDTH_MOBILE,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { type CSSProperties, type PropsWithChildren, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { PageBackgroundProvider } from '@/context/PageBackgroundProvider';
import { usePageBackground } from '@/hooks/usePageBackground';
import MusicPlayerBar from '@/components/MusicPlayerBar';
import FullPageLoader from '@/components/FullPageLoader';
import { logout } from '@/api/logout';
import { getApi } from '@/api/getApi';
import FullPageError from '@/components/FullPageError';
import { getSidebarState, saveSidebarState } from '../utils/localstorageSidebar';
import { useSidebarBrowser } from '@/context/SidebarBrowserContext';
import { useIsMobile } from '@/hooks/use-mobile';
import TopBar from '@/components/TopBar';
import { cn } from '../lib/utils';
import AppSidebar from '@/components/AppSidebar';

interface PageProps {
    title?: string;
    className?: string;
    containerClassName?: string;
    requiresAuth?: boolean;
    requireAdmin?: boolean;
    breadcrumbs?: React.ReactNode;
    bgItem?: React.ReactNode;
    showPlayerBar?: boolean;
    overlayHeader?: boolean;
    pagePadding?: boolean;
}

const isLoggedIn = () => Boolean(localStorage.getItem('jf_token'));

const PageContent = ({
    children,
    title,
    className,
    containerClassName,
    requiresAuth = false,
    requireAdmin = false,
    overlayHeader = false,
    pagePadding = true,
    breadcrumbs,
    bgItem,
    showPlayerBar = true,
}: PropsWithChildren<PageProps>) => {
    const navigate = useNavigate();
    const { isLoading, isError, data: user } = useCurrentUser();
    const { background } = usePageBackground();
    const { browseMode } = useSidebarBrowser();
    const isMobile = useIsMobile();
    const [showLoader, setShowLoader] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(() => getSidebarState());
    const [browseTransitionActive, setBrowseTransitionActive] = useState(browseMode);
    const [prevBrowseMode, setPrevBrowseMode] = useState(browseMode);

    if (browseMode !== prevBrowseMode) {
        setPrevBrowseMode(browseMode);
        if (browseMode) {
            setBrowseTransitionActive(true);
        }
    }

    useEffect(() => {
        if (title) document.title = title;
    }, [title]);

    useEffect(() => {
        if (browseMode) return;

        const timeout = window.setTimeout(() => setBrowseTransitionActive(false), 500);
        return () => window.clearTimeout(timeout);
    }, [browseMode]);

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
                            logout(getApi());
                            navigate('/login', { replace: true });
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

    const sidebarWidth = browseMode
        ? isMobile
            ? SIDEBAR_WIDTH_BROWSE_MOBILE
            : SIDEBAR_WIDTH_BROWSE
        : isMobile
          ? SIDEBAR_WIDTH_MOBILE
          : SIDEBAR_WIDTH;

    const useBrowseTransition = browseMode || browseTransitionActive;

    return (

        <div className={`relative flex flex-col min-h-dvh ${containerClassName ?? ''}`}>
        {background || bgItem}
        <TopBar overlay={overlayHeader} />
        <div className="flex flex-row">
            <div className="flex flex-col">
                Maybe sidebar here?
            </div>
            <div
                className={cn(
                    'relative flex flex-col flex-1 overflow-x-hidden overflow-y-auto z-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground [&::-webkit-scrollbar-thumb]:rounded-full',
                    pagePadding && 'py-4 px-4 sm:px-12',
                    !overlayHeader && 'pt-18' // Topbar has height of 14 + 4 (padding) = 18
                )}
            >
                {breadcrumbs && <div className="flex items-center gap-2 mb-4">{breadcrumbs}</div>}
                <main className={`w-full flex-1 ${className ?? ''}`}>{children}</main>
            </div>
        </div>
        
        {showPlayerBar && <MusicPlayerBar />}
    </div>
    );
};

const Page = (props: PropsWithChildren<PageProps>) => (
    <PageBackgroundProvider>
        <PageContent {...props} />
    </PageBackgroundProvider>
);

export default Page;
