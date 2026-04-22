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
    SidebarMenuSub,
} from '@/components/ui/sidebar';
import { ChartLine, Home, Library, Search } from 'lucide-react';
import { Link } from 'react-router';
import { NavUser } from './NavUser';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useTranslation } from 'react-i18next';
import { useUserViews } from '@/hooks/api/useUserViews';
import JellyfinLibraryIcon from './JellyfinLibraryIcon';
import { getServerUrl } from '@/utils/localstorageCredentials';
import { useTheme } from './theme-provider';
import { useConfig } from '@/hooks/api/useConfig';
import { getEffectiveTheme } from '@/utils/effectiveTheme';

function serverUrlToDomain(url: string) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch {
        return url;
    }
}

const AppSidebar = () => {
    const { t } = useTranslation('sidebar');
    const { config } = useConfig();
    const { data: views } = useUserViews();
    const serverUrl = getServerUrl();
    const serverDomain = serverUrl ? serverUrlToDomain(serverUrl) : null;
    const { theme } = useTheme();
    const effectiveTheme = getEffectiveTheme(theme);

    return (
        <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuButton
                        size="lg"
                        className="cursor-default hover:bg-transparent active:bg-transparent"
                    >
                        <Avatar className="h-8 w-8 p-1 rounded-lg">
                            <AvatarImage
                                src={effectiveTheme === 'dark' ? '/logo.svg' : '/logo-dark.svg'}
                                alt={'Pelagica logo'}
                            />
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
                    </SidebarMenuButton>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t('navigation')}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to={'/'}>
                                        <Home />
                                        {t('home')}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to={'/library'}>
                                        <Library />
                                        {t('library')}
                                    </Link>
                                </SidebarMenuButton>
                                {views && views.Items && views.Items.length > 0 && (
                                    <SidebarMenuSub>
                                        {views.Items.map((view) => (
                                            <SidebarMenuItem key={view.Id}>
                                                <SidebarMenuButton asChild>
                                                    <Link to={`/library?library=${view.Id}`}>
                                                        <JellyfinLibraryIcon
                                                            libraryType={view.CollectionType}
                                                        />
                                                        {view.Name}
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenuSub>
                                )}
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to={'/search'}>
                                        <Search />
                                        {t('search')}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {config && config.streamystatsUrl && config.showStreamystatsButton && (
                                <SidebarMenuButton
                                    className="cursor-pointer"
                                    title="Streamystats"
                                    onClick={() => {
                                        window.open(config.streamystatsUrl, '_blank');
                                    }}
                                >
                                    <>
                                        <ChartLine />
                                        Streamystats
                                    </>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;
