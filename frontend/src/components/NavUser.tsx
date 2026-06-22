import {
    ChevronsUpDown,
    Check,
    Globe,
    Laptop,
    LogOut,
    Moon,
    Sun,
    Settings,
    Settings2,
    Fingerprint,
    TriangleAlert,
    DotIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { Link, useNavigate } from 'react-router';
import { logout } from '@/api/logout';
import { useTheme } from './theme-provider';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useUpdateUserConfiguration } from '@/hooks/api/playbackPreferences/useUpdateUserConfiguration';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { iso6392 } from 'iso-639-2';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Label } from '@radix-ui/react-dropdown-menu';
import { getUserProfileImageUrl } from '@/utils/jellyfinUrls';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { useAuthorizeQuickConnect } from '@/hooks/api/useQuickConnect';
import {
    clearLocalTheme,
    getLocalTheme,
    LOCAL_THEME_PELAGICA_DEFAULT,
    LOCAL_THEME_SERVER_DEFAULT,
    saveLocalTheme,
} from '@/utils/localTheme';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectLabel,
} from '@/components/ui/select';
import { useThemes } from '@/hooks/api/themes/useThemes';
import { useQueryClient } from '@tanstack/react-query';

const FlagIcon = ({ countryCode }: { countryCode: string }) => {
    const flagUrl = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`;
    return (
        <img src={flagUrl} className="inline h-4 w-6 object-cover" alt={`${countryCode} Flag`} />
    );
};

const AuthorizeQuickConnectDialog = ({
    onAuthorize,
    isLoading,
    hasSuccess,
    hasError,
}: {
    onAuthorize: (code: string) => void;
    isLoading: boolean;
    hasSuccess: boolean;
    hasError: boolean;
}) => {
    const { t } = useTranslation('sidebar');
    const [code, setCode] = useState('');
    const [open, setOpen] = useState(false);
    const authorizedCodeRef = useRef<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const successTimeoutRef = useRef<any | null>(null);
    const prevErrorRef = useRef(false);
    const prevOpenRef = useRef(false);

    useEffect(() => {
        // Only reset when going from open to closed
        if (prevOpenRef.current && !open) {
            queueMicrotask(() => {
                setCode('');
                authorizedCodeRef.current = null;
                prevErrorRef.current = false;
                if (successTimeoutRef.current) {
                    clearTimeout(successTimeoutRef.current);
                    successTimeoutRef.current = null;
                }
            });
        }
        prevOpenRef.current = open;
    }, [open]);

    useEffect(() => {
        if (code.length === 6 && !hasSuccess && !isLoading && authorizedCodeRef.current !== code) {
            authorizedCodeRef.current = code;
            onAuthorize(code);
        }
    }, [code, onAuthorize, hasSuccess, isLoading]);

    useEffect(() => {
        if (hasSuccess && !successTimeoutRef.current) {
            successTimeoutRef.current = setTimeout(() => {
                setOpen(false);
                successTimeoutRef.current = null;
            }, 1500);
        }
    }, [hasSuccess]);

    useEffect(() => {
        if (hasError && !prevErrorRef.current && code.length === 6) {
            queueMicrotask(() => {
                setCode('');
                authorizedCodeRef.current = null;
            });
        }
        prevErrorRef.current = hasError;
    }, [hasError, code.length]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <SidebarMenuButton onClick={(e) => e.stopPropagation()}>
                    <Fingerprint className="text-muted-foreground" />
                    {t('quick_connect')}
                </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('authorize_quick_connect')}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-4">
                    {t('enter_quick_connect_code')}
                </p>
                <div className="flex justify-center max-w-full overflow-hidden">
                    <InputOTP
                        maxLength={6}
                        onChange={(value) => setCode(value)}
                        value={code}
                        disabled={isLoading || hasSuccess}
                    >
                        <InputOTPGroup className="gap-0 sm:gap-2 sm:*:data-[slot=input-otp-slot]:rounded-md sm:*:data-[slot=input-otp-slot]:border">
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <div
                            role="separator"
                            className="text-muted-foreground hidden sm:inline-flex"
                        >
                            <DotIcon />
                        </div>
                        <InputOTPGroup className="gap-0 sm:gap-2 sm:*:data-[slot=input-otp-slot]:rounded-md sm:*:data-[slot=input-otp-slot]:border">
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                {hasError && (
                    <p className="text-sm mt-4 text-destructive text-center flex items-center justify-center gap-2">
                        <TriangleAlert size={16} />
                        {t('quick_connect_authorization_failed')}
                    </p>
                )}
                {hasSuccess && (
                    <p className="text-sm mt-4 text-primary text-center flex items-center justify-center gap-2">
                        <Check size={16} />
                        {t('quick_connect_authorized')}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
};

const LanguageCombobox = ({
    onSelect,
    selected,
    open,
    onOpenChange,
}: {
    onSelect: (code: string) => void;
    selected: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const { t } = useTranslation('sidebar');
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded="false"
                    className="w-full justify-between"
                >
                    {iso6392.find(
                        (lang) => lang.iso6392T === selected || lang.iso6392B === selected
                    )
                        ? `${
                              iso6392.find(
                                  (lang) => lang.iso6392T === selected || lang.iso6392B === selected
                              )!.name
                          } (${selected})`
                        : t('select_language')}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-70 max-w-full p-0">
                <Command>
                    <CommandInput placeholder="Search language..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                            {iso6392
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((lang) => {
                                    const code = lang.iso6392T || lang.iso6392B;

                                    return (
                                        <CommandItem
                                            key={code}
                                            value={lang.name}
                                            onSelect={() => onSelect(code)}
                                        >
                                            {lang.name} ({code})
                                            <Check
                                                className={cn(
                                                    'ml-auto',
                                                    selected === code ? 'opacity-100' : 'opacity-0'
                                                )}
                                            />
                                        </CommandItem>
                                    );
                                })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export function NavUser() {
    const { t } = useTranslation('sidebar');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isMobile } = useSidebar();
    const { theme, setTheme } = useTheme();
    const { data: user } = useCurrentUser();
    const updateUserConfiguration = useUpdateUserConfiguration();
    const [audioLanguageOpen, setAudioLanguageOpen] = useState(false);
    const [subtitleLanguageOpen, setSubtitleLanguageOpen] = useState(false);
    const authorizeQuickConnect = useAuthorizeQuickConnect();
    const [authorizeQuickCConnectLoading, setAuthorizeQuickConnectLoading] = useState(false);
    const [quickConnectSuccess, setQuickConnectSuccess] = useState(false);
    const [quickConnectError, setQuickConnectError] = useState(false);
    const [localTheme, setLocalTheme] = useState<string | null>(
        getLocalTheme() ?? LOCAL_THEME_SERVER_DEFAULT
    );
    const { data: themes, isLoading: isLoadingThemes } = useThemes();

    const onAuthorizeQuickConnect = (code: string) => {
        setAuthorizeQuickConnectLoading(true);
        setQuickConnectSuccess(false);
        setQuickConnectError(false);
        authorizeQuickConnect
            .mutateAsync({ code })
            .then(() => {
                setAuthorizeQuickConnectLoading(false);
                setQuickConnectSuccess(true);
                console.log('Quick Connect authorized successfully');
            })
            .catch((error) => {
                // Jellyfin's Quick Connect authorize endpoint returns a 500 error even on success
                // If it's a 500 error, treat it as success since the authorization actually works
                if (error?.response?.status === 500) {
                    setAuthorizeQuickConnectLoading(false);
                    setQuickConnectSuccess(true);
                    console.log('Quick Connect authorized successfully (500 workaround)');
                } else {
                    setAuthorizeQuickConnectLoading(false);
                    setQuickConnectError(true);
                    console.error('Error authorizing Quick Connect:', error);
                }
            });
    };

    if (!user?.Id) return null;

    const profileImageUrl = getUserProfileImageUrl(user.Id);
    const userName = user?.Name || t('unknown_user');
    const isAdmin = user?.Policy?.IsAdministrator;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={profileImageUrl}
                                    alt={userName + ' profile image'}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {userName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-md leading-tight">
                                <span className="truncate font-medium">{userName}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={profileImageUrl}
                                        alt={userName + ' profile image'}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {userName
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-md leading-tight">
                                    <span className="truncate font-medium">{userName}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                                    {theme === 'light' ? (
                                        <Sun className="text-muted-foreground" />
                                    ) : theme === 'dark' ? (
                                        <Moon className="text-muted-foreground" />
                                    ) : (
                                        <Laptop className="text-muted-foreground" />
                                    )}
                                    {t('theme')}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side={isMobile ? 'bottom' : 'right'}
                                align="start"
                                sideOffset={4}
                            >
                                <DropdownMenuItem onClick={() => setTheme('light')}>
                                    <Sun className="text-muted-foreground" />
                                    {t('light')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('dark')}>
                                    <Moon className="text-muted-foreground" />
                                    {t('dark')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('system')}>
                                    <Laptop className="text-muted-foreground" />
                                    {t('system')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                                    <Globe className="text-muted-foreground" />
                                    {t('language')}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side={isMobile ? 'bottom' : 'right'}
                                align="start"
                                sideOffset={4}
                            >
                                <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
                                    <FlagIcon countryCode="us" />
                                    English
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => i18n.changeLanguage('de')}>
                                    <FlagIcon countryCode="de" />
                                    Deutsch
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => i18n.changeLanguage('sv')}>
                                    <FlagIcon countryCode="se" />
                                    Svenska
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => i18n.changeLanguage('fr')}>
                                    <FlagIcon countryCode="fr" />
                                    Français
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => i18n.changeLanguage('pt')}>
                                    <FlagIcon countryCode="pt" />
                                    Português
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => i18n.changeLanguage('ja')}>
                                    <FlagIcon countryCode="jp" />
                                    日本語
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Dialog>
                            <DialogTrigger asChild>
                                <SidebarMenuButton>
                                    <Settings2 className="text-muted-foreground" />
                                    {t('preferences')}
                                </SidebarMenuButton>
                            </DialogTrigger>
                            <DialogContent className="max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{t('preferences')}</DialogTitle>
                                </DialogHeader>
                                <div>
                                    <Label className="mb-2 text-sm font-medium">
                                        {t('audio_language_preference')}
                                    </Label>
                                    <LanguageCombobox
                                        selected={user.Configuration?.AudioLanguagePreference || ''}
                                        onSelect={(code) => {
                                            updateUserConfiguration.mutate({
                                                userId: user.Id!,
                                                playbackPreferences: {
                                                    AudioLanguagePreference: code,
                                                },
                                            });
                                            setAudioLanguageOpen(false);
                                        }}
                                        open={audioLanguageOpen}
                                        onOpenChange={setAudioLanguageOpen}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 text-sm font-medium">
                                        {t('subtitle_language_preference')}
                                    </Label>
                                    <LanguageCombobox
                                        selected={
                                            user.Configuration?.SubtitleLanguagePreference || ''
                                        }
                                        onSelect={(code) => {
                                            updateUserConfiguration.mutate({
                                                userId: user.Id!,
                                                playbackPreferences: {
                                                    SubtitleLanguagePreference: code,
                                                },
                                            });
                                            setSubtitleLanguageOpen(false);
                                        }}
                                        open={subtitleLanguageOpen}
                                        onOpenChange={setSubtitleLanguageOpen}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 text-sm font-medium">
                                        {t('theme_preference')}
                                    </Label>
                                    <Select
                                        value={localTheme || undefined}
                                        onValueChange={(value) => {
                                            if (value === LOCAL_THEME_SERVER_DEFAULT) {
                                                clearLocalTheme();
                                            } else {
                                                saveLocalTheme(value);
                                            }

                                            setLocalTheme(value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('select_theme')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={LOCAL_THEME_SERVER_DEFAULT}>
                                                    {t('server_default')}
                                                </SelectItem>
                                                <SelectItem value={LOCAL_THEME_PELAGICA_DEFAULT}>
                                                    {t('pelagica_default')}
                                                </SelectItem>
                                            </SelectGroup>
                                            {!isLoadingThemes && themes && (
                                                <SelectGroup>
                                                    <SelectLabel>Custom Themes</SelectLabel>
                                                    {themes.map((theme) => (
                                                        <SelectItem key={theme.id} value={theme.id}>
                                                            {theme.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <DropdownMenuSeparator />
                        <AuthorizeQuickConnectDialog
                            onAuthorize={onAuthorizeQuickConnect}
                            isLoading={authorizeQuickCConnectLoading}
                            hasSuccess={quickConnectSuccess}
                            hasError={quickConnectError}
                        />
                        {isAdmin && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/settings">
                                        <Settings className="text-muted-foreground" />
                                        {t('pelagica_config')}
                                    </Link>
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                logout(queryClient);
                                navigate('/login', { replace: true });
                            }}
                        >
                            <LogOut />
                            {t('logout')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
