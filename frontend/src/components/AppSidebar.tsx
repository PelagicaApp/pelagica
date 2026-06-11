import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { ChartLine } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { NavUser } from './NavUser';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useConfig } from '@/hooks/api/useConfig';
import { getServerUrl } from '@/utils/localstorageCredentials';
import { useTheme } from './theme-provider';
import { getEffectiveTheme } from '@/utils/effectiveTheme';
import { useEffect } from 'react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { SidebarBrowser } from '@/components/SidebarBrowser';
import { SidebarNavigation } from '@/components/SidebarNavigation';
import { useSidebarBrowser } from '@/context/SidebarBrowserContext';

function serverUrlToDomain(url: string) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch {
        return url;
    }
}

export const LinkSidebarItem = ({
    url,
    text,
    icon,
}: {
    url: string;
    text: string;
    icon: string;
}) => {
    if (!url) return null;
    if (!text) text = url;
    if (!icon) icon = 'link-2';

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                className="cursor-pointer"
                tooltip={text}
                onClick={() => {
                    window.open(url, '_blank');
                }}
            >
                <>
                    <DynamicIcon name={icon as IconName} />
                    {text}
                </>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
};

const AppSidebar = () => {
    const { t } = useTranslation('sidebar');
    const { setOpen, setOpenMobile, isMobile } = useSidebar();
    const { browseMode, setBrowseMode } = useSidebarBrowser();
    const location = useLocation();
    const { config } = useConfig();
    const serverUrl = getServerUrl();
    const serverDomain = serverUrl ? serverUrlToDomain(serverUrl) : null;
    const { theme } = useTheme();
    const effectiveTheme = getEffectiveTheme(theme);
    const defaultLogo = effectiveTheme === 'dark' ? '/logo.svg' : '/logo-dark.svg';
    const configuredLogo =
        effectiveTheme === 'dark' ? config?.logoDarkUrl || '' : config?.logoLightUrl || '';
    const logoSrc = configuredLogo || defaultLogo;

    const validLinks = config?.links?.filter((link) => link.url && link.text) ?? [];

    useEffect(() => {
        if (browseMode && !isMobile) {
            setOpen(true);
        }
    }, [browseMode, isMobile, setOpen]);

    useEffect(() => {
        if (location.pathname !== '/' && location.pathname !== '/search') return;

        setBrowseMode(false);
        if (isMobile) {
            setOpenMobile(false);
        } else {
            setOpen(false);
        }
    }, [isMobile, location.pathname, setBrowseMode, setOpen, setOpenMobile]);

    return (
        <Sidebar variant="floating" collapsible="offcanvas" inline>
            <SidebarHeader className="pb-1">
                <SidebarMenu>
                    <SidebarMenuButton
                        size="lg"
                        asChild
                        className="hover:bg-sidebar-accent cursor-pointer"
                        isActive={location.pathname === '/'}
                        tooltip={t('home')}
                    >
                        <Link to="/" title="Home">
                            <Avatar className="h-8 w-8 p-1 rounded-lg">
                                <AvatarImage src={logoSrc} alt={'Pelagica logo'} />
                                <AvatarFallback className="rounded-lg">{'PE'}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {config?.serverName || 'Pelagica'}
                                </span>
                                {serverDomain && (
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                        {serverDomain}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent
                className={browseMode ? 'gap-0 overflow-hidden pb-1' : 'gap-2 overflow-auto pb-1'}
            >
                {browseMode ? (
                    <SidebarBrowser className="mx-1 min-h-0 flex-1 border-0 bg-transparent p-2" />
                ) : (
                    <SidebarNavigation />
                )}
                {!browseMode && validLinks.length > 0 && (
                    <SidebarGroup className="shrink-0 py-1">
                        <SidebarGroupLabel className="h-7">{t('category_links')}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {validLinks.map((link, index) => (
                                    <LinkSidebarItem
                                        key={index}
                                        url={link.url}
                                        text={link.text}
                                        icon={link.icon}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="gap-1">
                {config?.streamystatsUrl && config.showStreamystatsButton && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className="cursor-pointer"
                                tooltip="Streamystats"
                                onClick={() => window.open(config.streamystatsUrl, '_blank')}
                            >
                                <ChartLine />
                                Streamystats
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
};

export default AppSidebar;
