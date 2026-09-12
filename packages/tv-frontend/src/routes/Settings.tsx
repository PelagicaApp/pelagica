import {
    clearCredentials,
    getServerUrl,
    getUserProfileImageUrl,
    useCurrentUser,
    useServerInfo,
} from '@pelagica/core';
import i18n, { SUPPORTED_LANGUAGES } from '@pelagica/core/i18n';
import { useTranslation } from 'react-i18next';
import FocusableButton from '../components/FocusableButton';
import { useNavigate } from '@/router';
import { Eraser, LogOut } from 'lucide-react';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useLayerFocusable as useFocusable } from '@/router/useLayerFocusable';
import { cn } from '@/lib/utils';
import { FOCUS_RING_LARGE } from '@/lib/focus-styles';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { Card, CardContent } from '@/components/ui/card';
import pkg from '../../package.json' with { type: 'json' };
import { clearLogosCache } from '../lib/studio-logos';
import { toast } from '../components/ui/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const SettingsSection = ({
    title,
    children,
    focusable = true,
}: {
    title: string;
    children: React.ReactNode;
    focusable?: boolean;
}) => {
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({
        focusable,
    });

    return (
        <FocusContext.Provider value={focusKey}>
            <div className="flex flex-col gap-2 w-full">
                <span className="text-xs text-muted-foreground">{title}</span>
                <Card className="w-full" ref={ref}>
                    <CardContent>{children}</CardContent>
                </Card>
            </div>
        </FocusContext.Provider>
    );
};

const Settings = () => {
    const { t } = useTranslation(['settings', 'sidebar', 'common']);
    const queryClient = useQueryClient();
    const serverUrl = getServerUrl();
    const { data: user } = useCurrentUser();
    const { data: serverInfo } = useServerInfo();
    const navigate = useNavigate();
    const { ref: aboutRef, focused: aboutFocused } = useFocusable<object, HTMLDivElement>({
        focusOnHover: true,
    });
    useScrollIntoViewOnFocus(aboutRef, aboutFocused);

    const profileImageUrl = getUserProfileImageUrl(user?.Id ?? '');
    const userName = user?.Name ?? '';
    const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    const serverInfoLine = serverInfo ? `${serverInfo.ServerName} ⋅ ${serverUrl}` : serverUrl;

    return (
        <div className="flex flex-col items-start gap-6">
            <h1 className="text-2xl font-semibold">Pelagica</h1>

            <SettingsSection title={t('settings:account_section_title')}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-11 w-11 rounded-lg">
                            <AvatarImage src={profileImageUrl} alt={userName} />
                            <AvatarFallback className="rounded-lg text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-lg font-medium">{userName}</span>
                            <span className="text-xs text-muted-foreground">{serverInfoLine}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <FocusableButton
                            onClick={() => {
                                clearCredentials();
                                navigate('/login', { mode: 'reset' });
                            }}
                        >
                            <LogOut />
                            {t('sidebar:logout')}
                        </FocusableButton>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title={t('settings:language_section_title')}>
                <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LANGUAGES.map(({ code, Flag, label }) => (
                        <FocusableButton
                            key={code}
                            variant={i18n.language === code ? 'default' : 'outline'}
                            onClick={() => i18n.changeLanguage(code)}
                            className={cn('gap-2 scroll-m-6')}
                        >
                            <span className="inline-block w-6 h-4 shrink-0 overflow-hidden rounded-xs">
                                <Flag style={{ width: '100%', height: '100%' }} />
                            </span>
                            {label}
                        </FocusableButton>
                    ))}
                </div>
            </SettingsSection>

            <SettingsSection title={t('settings:application_section_title')}>
                <FocusableButton
                    onClick={() => {
                        clearLogosCache();
                        queryClient.clear();
                        toast.add({
                            title: t('settings:clear_app_cache_success'),
                            type: 'success',
                        });
                    }}
                >
                    <Eraser />
                    {t('settings:clear_app_cache_button')}
                </FocusableButton>
            </SettingsSection>

            <SettingsSection title={t('settings:about_section_title')} focusable={false}>
                <div
                    ref={aboutRef}
                    tabIndex={-1}
                    className={cn(
                        'w-fit rounded-md outline-none scroll-m-6',
                        aboutFocused && FOCUS_RING_LARGE
                    )}
                >
                    <p className="text-muted-foreground">
                        {t('settings:version_label')} {pkg.version}
                    </p>
                </div>
            </SettingsSection>
        </div>
    );
};

export default Settings;
