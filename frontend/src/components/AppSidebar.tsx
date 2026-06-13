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
import { ChartLine, ChevronRight, Home, Library, Search } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import {
    getLibraryCollapsibleState,
    saveLibraryCollapsibleState,
} from '../utils/localstorageSidebar';
import { useState } from 'react';
import { Button } from './ui/button';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '../utils/itemTypes';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';

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
                title={text}
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
    const { config } = useConfig();
    const { data: views } = useUserViews();
    const serverUrl = getServerUrl();
    const serverDomain = serverUrl ? serverUrlToDomain(serverUrl) : null;
    const { theme } = useTheme();
    const effectiveTheme = getEffectiveTheme(theme);
    const [libraryOpen, setLibraryOpen] = useState(getLibraryCollapsibleState);
    const defaultLogo = effectiveTheme === 'dark' ? '/logo.svg' : '/logo-dark.svg';
    const configuredLogo =
        effectiveTheme === 'dark' ? config?.logoDarkUrl || '' : config?.logoLightUrl || '';
    const logoSrc = configuredLogo || defaultLogo;

    const libraries =
        views?.Items?.filter((library) =>
            SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(library.CollectionType!)
        ) ?? [];

    const validLinks = config?.links?.filter((link) => link.url && link.text) ?? [];

    return (
        <Sidebar variant="floating" collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuButton
                        size="lg"
                        className="cursor-default hover:bg-transparent active:bg-transparent"
                    >
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
                                <Collapsible
                                    className="group/collapsible"
                                    open={libraryOpen}
                                    onOpenChange={(open) => {
                                        setLibraryOpen(open);
                                        saveLibraryCollapsibleState(open);
                                    }}
                                >
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton asChild>
                                            <div>
                                                <Button asChild variant="ghost" className="p-0!">
                                                    <Link to={'/library'}>
                                                        <Library />
                                                        {t('library')}
                                                    </Link>
                                                </Button>
                                                {libraries?.length > 0 && (
                                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                                )}
                                            </div>
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    {libraries?.length > 0 && (
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {libraries.map((library) => (
                                                    <SidebarMenuItem key={library.Id}>
                                                        <SidebarMenuButton asChild>
                                                            <Link
                                                                to={`/library?library=${library.Id}`}
                                                            >
                                                                <JellyfinLibraryIcon
                                                                    libraryType={
                                                                        library.CollectionType
                                                                    }
                                                                />
                                                                {library.Name}
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    )}
                                </Collapsible>
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
                {validLinks.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>{t('category_links')}</SidebarGroupLabel>
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
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;
