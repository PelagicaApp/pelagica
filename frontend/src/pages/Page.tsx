import AppSidebar from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { type CSSProperties, type PropsWithChildren, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getServerUrl } from '@/utils/localstorageCredentials';
import { PageBackgroundProvider } from '@/context/PageBackgroundProvider';
import { usePageBackground } from '@/hooks/usePageBackground';
import MusicPlayerBar from '@/components/MusicPlayerBar';
import { useTheme } from '@/components/theme-provider';
import { getEffectiveTheme } from '@/utils/effectiveTheme';
import FullPageLoader from '@/components/FullPageLoader';
import { logout } from '@/api/logout';
import { getApi } from '@/api/getApi';
import FullPageError from '@/components/FullPageError';
import { getSidebarState, saveSidebarState } from '../utils/localstorageSidebar';
import { SidebarBrowserMockProvider } from '@/context/SidebarBrowserMockContext';
import { SidebarBrowserDetail } from '@/components/SidebarBrowserDetail';

interface PageProps {
    title?: string;
    className?: string;
    containerClassName?: string;
    requiresAuth?: boolean;
    requireAdmin?: boolean;
    sidebar?: boolean;
    breadcrumbs?: React.ReactNode;
    bgItem?: React.ReactNode;
    showPlayerBar?: boolean;
}

const isLoggedIn = () => {
    return Boolean(localStorage.getItem('jf_token'));
};

function serverUrlToDomain(url: string) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch {
        return url;
    }
}

const PageContent = ({
    children,
    title,
    className,
    containerClassName,
    requiresAuth = false,
    requireAdmin = false,
    sidebar = true,
    breadcrumbs,
    bgItem,
    showPlayerBar = true,
}: PropsWithChildren<PageProps>) => {
    const navigate = useNavigate();
    const { isLoading, isError, data: user } = useCurrentUser();
    const { background } = usePageBackground();
    const serverUrl = getServerUrl();
    const serverDomain = serverUrl ? serverUrlToDomain(serverUrl) : null;
    const { theme } = useTheme();
    const effectiveTheme = getEffectiveTheme(theme);
    const [showLoader, setShowLoader] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(() => getSidebarState());

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

        const t = setTimeout(() => {
            setShowLoader(true);
        }, 600);

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

    if (requireAdmin && user && !user.Policy?.IsAdministrator) {
        return (
            <FullPageError
                title="Access Denied"
                message="You do not have the necessary permissions to view this page."
                content={
                    <Button
                        onClick={() => {
                            navigate('/', { replace: true });
                        }}
                    >
                        Return to home
                    </Button>
                }
            />
        );
    }

    return (
        <SidebarBrowserMockProvider>
            <SidebarProvider
                className={`relative min-h-dvh h-dvh ${containerClassName ?? ''}`}
                style={
                    {
                        '--sidebar-width': '28rem',
                    } as CSSProperties
                }
                open={sidebarOpen ?? true}
                onOpenChange={(open) => {
                    setSidebarOpen(open);
                    saveSidebarState(open);
                }}
            >
                {background || bgItem}
                {sidebar && <AppSidebar />}
                <div className="relative w-full flex flex-col overflow-x-hidden overflow-y-auto h-dvh md:h-[calc(100dvh-2rem)] px-4 my-0 md:my-4 z-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground [&::-webkit-scrollbar-thumb]:rounded-full">
                {sidebar && breadcrumbs ? (
                    <div className="flex items-center gap-2 mb-4">
                        <SidebarTrigger />
                        {breadcrumbs}
                    </div>
                ) : (
                    <div className="flex items-center justify-between py-4 md:hidden">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 p-1 rounded-lg">
                                <AvatarImage
                                    src={effectiveTheme === 'dark' ? '/logo.svg' : '/logo-dark.svg'}
                                    alt={'Pelagica logo'}
                                />
                                <AvatarFallback className="rounded-lg">{'PE'}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">Pelagica</span>
                                {serverDomain && (
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                        {serverDomain}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button asChild size={'icon'} variant={'ghost'}>
                            <SidebarTrigger />
                        </Button>
                    </div>
                )}
                <main className={`w-full ${className ?? ''}`}>
                    {sidebar && <SidebarBrowserDetail />}
                    {children}
                </main>
                {showPlayerBar && <MusicPlayerBar />}
            </div>
            </SidebarProvider>
        </SidebarBrowserMockProvider>
    );
};

const Page = (props: PropsWithChildren<PageProps>) => {
    return (
        <PageBackgroundProvider>
            <PageContent {...props} />
        </PageBackgroundProvider>
    );
};

export default Page;
