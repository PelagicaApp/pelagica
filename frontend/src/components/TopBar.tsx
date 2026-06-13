import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
    ChartLine,
    Check,
    ChevronDown,
    ChevronsUpDown,
    DotIcon,
    Fingerprint,
    Globe,
    Home,
    House,
    Laptop,
    Library,
    LogOut,
    Menu,
    Moon,
    Music,
    Search,
    Settings,
    Settings2,
    Sun,
    TriangleAlert,
    X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { useUserViews } from '@/hooks/api/useUserViews';
import { useConfig } from '@/hooks/api/useConfig';
import { useTheme } from '@/components/theme-provider';
import { getEffectiveTheme } from '@/utils/effectiveTheme';
import { logout } from '@/api/logout';
import { getUserProfileImageUrl } from '@/utils/jellyfinUrls';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '@/utils/itemTypes';
import JellyfinLibraryIcon from './JellyfinLibraryIcon';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useUpdateUserConfiguration } from '@/hooks/api/playbackPreferences/useUpdateUserConfiguration';
import { useAuthorizeQuickConnect } from '@/hooks/api/useQuickConnect';
import { iso6392 } from 'iso-639-2';
import { cn } from '@/lib/utils';
import {
    clearLocalTheme,
    getLocalTheme,
    LOCAL_THEME_PELAGICA_DEFAULT,
    LOCAL_THEME_SERVER_DEFAULT,
    saveLocalTheme,
} from '@/utils/localTheme';
import { useThemes } from '@/hooks/api/themes/useThemes';

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
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Fingerprint className="text-muted-foreground" />
                    {t('quick_connect')}
                </DropdownMenuItem>
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
                        onChange={setCode}
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
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {iso6392.find((l) => l.iso6392T === selected || l.iso6392B === selected)
                        ? `${iso6392.find((l) => l.iso6392T === selected || l.iso6392B === selected)!.name} (${selected})`
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

const UserMenu = () => {
    const { t } = useTranslation('sidebar');
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { data: user } = useCurrentUser();
    const updateUserConfiguration = useUpdateUserConfiguration();
    const [audioLanguageOpen, setAudioLanguageOpen] = useState(false);
    const [subtitleLanguageOpen, setSubtitleLanguageOpen] = useState(false);
    const authorizeQuickConnect = useAuthorizeQuickConnect();
    const [quickConnectLoading, setQuickConnectLoading] = useState(false);
    const [quickConnectSuccess, setQuickConnectSuccess] = useState(false);
    const [quickConnectError, setQuickConnectError] = useState(false);
    const [localTheme, setLocalTheme] = useState<string | null>(
        getLocalTheme() ?? LOCAL_THEME_SERVER_DEFAULT
    );
    const { data: themes, isLoading: isLoadingThemes } = useThemes();

    const onAuthorizeQuickConnect = (code: string) => {
        setQuickConnectLoading(true);
        setQuickConnectSuccess(false);
        setQuickConnectError(false);
        authorizeQuickConnect
            .mutateAsync({ code })
            .then(() => {
                setQuickConnectLoading(false);
                setQuickConnectSuccess(true);
            })
            .catch((err) => {
                if (err?.response?.status === 500) {
                    setQuickConnectLoading(false);
                    setQuickConnectSuccess(true);
                } else {
                    setQuickConnectLoading(false);
                    setQuickConnectError(true);
                }
            });
    };

    if (!user?.Id) return null;

    const profileImageUrl = getUserProfileImageUrl(user.Id);
    const userName = user?.Name || t('unknown_user');
    const isAdmin = user?.Policy?.IsAdministrator;
    const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                    <Avatar className="h-7 w-7 rounded-lg">
                        <AvatarImage src={profileImageUrl} alt={userName} />
                        <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
                        {userName}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-lg">
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={profileImageUrl} alt={userName} />
                            <AvatarFallback className="rounded-lg text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-medium">{userName}</span>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Theme */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        {theme === 'light' ? (
                            <Sun className="text-muted-foreground" />
                        ) : theme === 'dark' ? (
                            <Moon className="text-muted-foreground" />
                        ) : (
                            <Laptop className="text-muted-foreground" />
                        )}
                        {t('theme')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
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
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Language */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Globe className="text-muted-foreground" />
                        {t('language')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {[
                                { code: 'en', flag: 'us', label: 'English' },
                                { code: 'de', flag: 'de', label: 'Deutsch' },
                                { code: 'sv', flag: 'se', label: 'Svenska' },
                                { code: 'fr', flag: 'fr', label: 'Français' },
                                { code: 'pt', flag: 'pt', label: 'Português' },
                                { code: 'ja', flag: 'jp', label: '日本語' },
                            ].map(({ code, flag, label }) => (
                                <DropdownMenuItem
                                    key={code}
                                    onClick={() => i18n.changeLanguage(code)}
                                >
                                    <img
                                        src={`https://flagcdn.com/${flag}.svg`}
                                        className="inline h-4 w-6 object-cover"
                                        alt={flag}
                                    />
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Preferences */}
                <Dialog>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Settings2 className="text-muted-foreground" />
                            {t('preferences')}
                        </DropdownMenuItem>
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
                                        playbackPreferences: { AudioLanguagePreference: code },
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
                                selected={user.Configuration?.SubtitleLanguagePreference || ''}
                                onSelect={(code) => {
                                    updateUserConfiguration.mutate({
                                        userId: user.Id!,
                                        playbackPreferences: { SubtitleLanguagePreference: code },
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
                                onValueChange={(val) => {
                                    if (val === LOCAL_THEME_SERVER_DEFAULT) clearLocalTheme();
                                    else saveLocalTheme(val);
                                    setLocalTheme(val);
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
                                            {themes.map((th) => (
                                                <SelectItem key={th.id} value={th.id}>
                                                    {th.name}
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
                    isLoading={quickConnectLoading}
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
                        logout();
                        navigate('/login', { replace: true });
                    }}
                >
                    <LogOut />
                    {t('logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const TopBar = ({ overlay = false }: { overlay?: boolean }) => {
    const { t } = useTranslation('sidebar');
    const { config } = useConfig();
    const { data: views } = useUserViews();
    const { theme } = useTheme();
    const effectiveTheme = getEffectiveTheme(theme);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        handleScroll();

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const defaultLogo = effectiveTheme === 'dark' ? '/logo.svg' : '/logo-dark.svg';
    const configuredLogo =
        effectiveTheme === 'dark' ? config?.logoDarkUrl || '' : config?.logoLightUrl || '';
    const logoSrc = configuredLogo || defaultLogo;

    const libraries =
        views?.Items?.filter((lib) =>
            SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(lib.CollectionType!)
        ) ?? [];

    const hasMusicLibrary = libraries.some((lib) => lib.CollectionType === 'music');

    const validLinks = config?.links?.filter((l) => l.url && l.text) ?? [];

    return (
        <header className="fixed top-0 z-50 w-full">
            {overlay && !scrolled && (
                <div className="absolute inset-0 -bottom-5 bg-linear-to-b from-background/70 to-transparent pointer-events-none" />
            )}

            <div
                className={cn(
                    'relative flex h-14 items-center gap-2 px-4 sm:px-12 transition-all duration-300 border-b',
                    !overlay || scrolled
                        ? 'border-border bg-background/60 backdrop-blur'
                        : 'border-transparent'
                )}
            >
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
                    <Avatar className="h-7 w-7 p-0.5 rounded-md">
                        <AvatarImage src={logoSrc} alt="logo" />
                        <AvatarFallback className="rounded-md text-xs">PE</AvatarFallback>
                    </Avatar>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-0.5">
                    <Button asChild variant="ghost" size="sm">
                        <Link to="/">
                            <House className="h-4 w-4" />
                            {t('home')}
                        </Link>
                    </Button>

                    <Button asChild variant="ghost" size="sm">
                        <Link to="/library">
                            <Library className="h-4 w-4" />
                            {t('library')}
                        </Link>
                    </Button>

                    {hasMusicLibrary && (
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/music">
                                <Music className="h-4 w-4" />
                                {t('music')}
                            </Link>
                        </Button>
                    )}

                    <Button asChild variant="ghost" size="sm">
                        <Link to="/search">
                            <Search className="h-4 w-4" />
                            {t('search')}
                        </Link>
                    </Button>

                    {config?.streamystatsUrl && config?.showStreamystatsButton && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                window.open(config.streamystatsUrl, '_blank', 'noopener,noreferrer')
                            }
                        >
                            <ChartLine className="h-4 w-4" />
                            Streamystats
                        </Button>
                    )}

                    {validLinks.map((link, i) => (
                        <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                        >
                            <DynamicIcon
                                name={(link.icon || 'link-2') as IconName}
                                className="h-4 w-4"
                            />
                            {link.text}
                        </Button>
                    ))}
                </nav>

                <div className="flex-1" />

                {/* User menu */}
                <UserMenu />

                {/* Mobile hamburger */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile nav drawer */}
            {mobileOpen && (
                <div className="md:hidden border-t px-3 py-2 flex flex-col gap-0.5 bg-background">
                    <Button
                        asChild
                        variant="ghost"
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                    >
                        <Link to="/">
                            <Home className="h-4 w-4" />
                            {t('home')}
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                    >
                        <Link to="/library">
                            <Library className="h-4 w-4" />
                            {t('library')}
                        </Link>
                    </Button>
                    {libraries.map((lib) => (
                        <Button
                            key={lib.Id}
                            asChild
                            variant="ghost"
                            className="justify-start pl-8"
                            onClick={() => setMobileOpen(false)}
                        >
                            <Link to={`/library?library=${lib.Id}`}>
                                <JellyfinLibraryIcon libraryType={lib.CollectionType} />
                                {lib.Name}
                            </Link>
                        </Button>
                    ))}
                    <Button
                        asChild
                        variant="ghost"
                        className="justify-start"
                        onClick={() => setMobileOpen(false)}
                    >
                        <Link to="/search">
                            <Search className="h-4 w-4" />
                            {t('search')}
                        </Link>
                    </Button>
                    {config?.streamystatsUrl && config?.showStreamystatsButton && (
                        <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                                window.open(
                                    config.streamystatsUrl,
                                    '_blank',
                                    'noopener,noreferrer'
                                );
                                setMobileOpen(false);
                            }}
                        >
                            <ChartLine className="h-4 w-4" />
                            Streamystats
                        </Button>
                    )}
                    {validLinks.map((link, i) => (
                        <Button
                            key={i}
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                                window.open(link.url, '_blank', 'noopener,noreferrer');
                                setMobileOpen(false);
                            }}
                        >
                            <DynamicIcon
                                name={(link.icon || 'link-2') as IconName}
                                className="h-4 w-4"
                            />
                            {link.text}
                        </Button>
                    ))}
                </div>
            )}
        </header>
    );
};

export default TopBar;
