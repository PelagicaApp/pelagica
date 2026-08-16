import { clearCredentials, getServerUrl, useCurrentUser } from '@pelagica/core';
import i18n, { SUPPORTED_LANGUAGES } from '@pelagica/core/i18n';
import { useTranslation } from 'react-i18next';
import FocusableButton from '../components/FocusableButton';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { cn } from '@/lib/utils';
import { FOCUS_RING_LARGE } from '@/lib/focus-styles';
import { useScrollIntoViewOnFocus } from '@/lib/use-scroll-into-view-on-focus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import pkg from '../../package.json' with { type: 'json' };

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
            <Card className="w-full max-w-2xl" ref={ref}>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>
        </FocusContext.Provider>
    );
};

const Settings = () => {
    const { t } = useTranslation(['settings', 'sidebar', 'common']);
    const serverUrl = getServerUrl();
    const { data: user, isLoading } = useCurrentUser();
    const navigate = useNavigate();
    const { ref: aboutRef, focused: aboutFocused } = useFocusable<object, HTMLDivElement>({});
    useScrollIntoViewOnFocus(aboutRef, aboutFocused);

    return (
        <div className="flex flex-col items-start gap-6">
            <h1 className="text-2xl font-semibold">Pelagica</h1>

            <SettingsSection title={t('settings:account_section_title')}>
                <div className="flex flex-col gap-2">
                    <p className="text-muted-foreground">
                        {t('settings:server_label')}: {serverUrl || t('settings:not_configured')}
                    </p>
                    <p className="text-muted-foreground">
                        {t('settings:signed_in_as')}:{' '}
                        {isLoading
                            ? t('common:loading')
                            : (user?.Name ?? t('sidebar:unknown_user'))}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <FocusableButton
                            onClick={() => {
                                clearCredentials();
                                navigate('/login', { replace: true });
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
                        {t('settings:version_label')}: {pkg.version}
                    </p>
                </div>
            </SettingsSection>
        </div>
    );
};

export default Settings;
