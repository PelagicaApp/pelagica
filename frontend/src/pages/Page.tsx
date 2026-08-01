import { Button } from '@/components/ui/button';
import { type PropsWithChildren, useEffect, useState, useCallback } from 'react';
import { PageScrollProvider } from '@/context/PageScrollProvider';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { PageBackgroundProvider } from '@/context/PageBackgroundProvider';
import { usePageBackground } from '@/hooks/usePageBackground';
import MusicPlayerBar from '@/components/MusicPlayerBar';
import FullPageLoader from '@/components/FullPageLoader';
import { logout } from '@/api/logout';
import FullPageError from '@/components/FullPageError';
import TopBar from '@/components/TopBar';
import { cn } from '../lib/utils';
import { useQueryClient } from '@tanstack/react-query';

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
    showHeader?: boolean;
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
    showHeader = true,
    pagePadding = true,
    breadcrumbs,
    bgItem,
    showPlayerBar = true,
}: PropsWithChildren<PageProps>) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isLoading, isError, data: user } = useCurrentUser();
    const { background } = usePageBackground();
    const [showLoader, setShowLoader] = useState(true);
    const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
    const pageScrollRef = useCallback((node: HTMLDivElement | null) => {
        setScrollElement(node);
    }, []);

    useEffect(() => {
        if (title) document.title = title;
    }, [title]);

    useEffect(() => {
        if (requiresAuth && !isLoggedIn()) navigate('/login', { replace: true });
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

    return (
        <PageScrollProvider scrollElement={scrollElement}>
            <div
                className={cn(
                    'relative flex flex-col h-dvh min-h-0 overflow-hidden',
                    containerClassName
                )}
            >
                {background || bgItem}
                {showHeader && <TopBar overlay={overlayHeader} />}
                <div
                    ref={pageScrollRef}
                    data-page-scroll-root
                    className={cn(
                        'relative flex flex-col flex-1 min-h-0 overflow-x-hidden overflow-y-auto z-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground [&::-webkit-scrollbar-thumb]:rounded-full',
                        pagePadding && 'py-4 px-4 sm:px-12',
                        !overlayHeader && 'pt-18' // Topbar has height of 14 + 4 (padding) = 18
                    )}
                >
                    {breadcrumbs && (
                        <div className="flex items-center gap-2 mb-4">{breadcrumbs}</div>
                    )}
                    <main className={`w-full flex-1 ${className ?? ''}`}>{children}</main>
                </div>
                {showPlayerBar && <MusicPlayerBar />}
            </div>
        </PageScrollProvider>
    );
};

const Page = (props: PropsWithChildren<PageProps>) => (
    <PageBackgroundProvider>
        <PageContent {...props} />
    </PageBackgroundProvider>
);

export default Page;
