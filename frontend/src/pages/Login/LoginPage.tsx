import { useCallback, useEffect, useRef, useState } from 'react';
import Page from '../Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';
import { Info, Server, TriangleAlert, User } from 'lucide-react';
import { jellyfin } from '@/api/jellyfinClient';
import { useLogin } from '@/hooks/api/useLogin';
import {
    useQuickConnectInitiate,
    useQuickConnectStatus,
    useQuickConnectAuthenticate,
} from '@/hooks/api/useQuickConnect';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@/hooks/api/useConfig';
import { getServerUrl, saveServerUrl } from '@/utils/localstorageCredentials';
import { useServerBranding } from '../../hooks/api/useServerBranding';
import DOMPurify from 'dompurify';

const DEMO_SERVER_URL = 'https://jellyfin.streamyfin.app';
const DEMO_USERNAME = 'pelagica';

const Disclaimer = ({ text }: { text: string | null | undefined }) => {
    if (!text) return null;
    const sanitized = DOMPurify.sanitize(text);
    return (
        <div
            className="mt-4 text-sm text-muted-foreground text-center [&_a]:underline [&_a]:text-primary"
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
};

const LoginPage = () => {
    const isDemo = import.meta.env.VITE_IS_DEMO === 'true';

    const { config } = useConfig();
    const [serverUrl, setServerUrl] = useState<string>(() =>
        isDemo ? DEMO_SERVER_URL : getServerUrl() || ''
    );
    const { data: branding } = useServerBranding(serverUrl);
    const navigate = useNavigate();
    const { t } = useTranslation('login');
    const [step, setStep] = useState<'server' | 'login' | 'quickconnect'>(
        config?.serverAddress || serverUrl ? 'login' : 'server'
    );

    const [checkingServer, setCheckingServer] = useState(false);
    const [serverCheckError, setServerCheckError] = useState<string | null>(null);

    const login = useLogin();
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const quickConnectInitiate = useQuickConnectInitiate();
    const quickConnectAuthenticate = useQuickConnectAuthenticate();
    const [quickConnectSecret, setQuickConnectSecret] = useState<string | undefined>(undefined);
    const [quickConnectCode, setQuickConnectCode] = useState<string | null>(null);
    const [quickConnectError, setQuickConnectError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [quickConnectApproved, setQuickConnectApproved] = useState(false);
    const initiatingQuickConnectRef = useRef(false);

    const quickConnectStatus = useQuickConnectStatus(
        serverUrl || '',
        quickConnectSecret,
        isPolling
    );

    const [splashScreenUrl, setSplashScreenUrl] = useState<string | null>(serverUrl);

    useEffect(() => {
        if (isDemo) {
            saveServerUrl(DEMO_SERVER_URL);
        }
    }, [isDemo]);

    useEffect(() => {
        if (!serverUrl) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSplashScreenUrl(null);
            return;
        }
        const splashUrl = new URL('/Branding/Splashscreen', serverUrl).toString();
        setSplashScreenUrl(splashUrl);
    }, [serverUrl, step]);

    useEffect(() => {
        if (config?.serverAddress) {
            if (!config.serverAddress.trim()) return;
            if (
                !config.serverAddress.startsWith('http://') &&
                !config.serverAddress.startsWith('https://')
            ) {
                console.warn(
                    'Ignoring predefined server address: If you specify a server address in config.json, it must include http:// or https://'
                );
                return;
            }
            saveServerUrl(config.serverAddress);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setServerUrl(config.serverAddress);
            setStep('login');
            setServerCheckError(null);
        }
    }, [config?.serverAddress]);

    const initiateQuickConnect = useCallback(async () => {
        setQuickConnectError(null);
        try {
            const server = getServerUrl() || '';
            const result = await quickConnectInitiate.mutateAsync(server);

            if (result.Code && result.Secret) {
                setQuickConnectCode(result.Code);
                setQuickConnectSecret(result.Secret);
                setIsPolling(true);
            } else {
                setQuickConnectError(t('quick_connect_failed'));
            }
        } catch (error) {
            console.error('Quick Connect initiation error:', error);
            setQuickConnectError(t('quick_connect_failed'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    const handleQuickConnectAuthenticated = useCallback(async () => {
        if (!quickConnectSecret || quickConnectApproved) return;

        setQuickConnectApproved(true);
        setIsPolling(false);
        setLoggingIn(true);

        try {
            const server = getServerUrl() || '';
            await quickConnectAuthenticate.mutateAsync({ server, secret: quickConnectSecret });

            console.log('Quick Connect login successful');
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Quick Connect authentication error:', error);
            setQuickConnectError(t('quick_connect_failed'));
            setQuickConnectApproved(false);
            setLoggingIn(false);
        }
    }, [quickConnectSecret, quickConnectApproved, quickConnectAuthenticate, navigate, t]);

    useEffect(() => {
        if (step === 'quickconnect' && !quickConnectCode && !initiatingQuickConnectRef.current) {
            initiatingQuickConnectRef.current = true;
            initiateQuickConnect().finally(() => {
                initiatingQuickConnectRef.current = false;
            });
        }
    }, [quickConnectCode, step, initiateQuickConnect]);

    useEffect(() => {
        if (quickConnectStatus.data?.Authenticated) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            handleQuickConnectAuthenticated();
        }
    }, [quickConnectStatus.data, handleQuickConnectAuthenticated]);

    const onSubmitServer = async (e: React.FormEvent) => {
        setCheckingServer(true);

        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const serverInput = form.querySelector('#server-address') as HTMLInputElement;
        const serverAddress = serverInput?.value?.trim();

        if (!serverAddress) {
            setServerCheckError(t('please_enter_server_address'));
            setCheckingServer(false);
            return;
        }

        const servers = await jellyfin.discovery.getRecommendedServerCandidates(serverAddress);
        const best = jellyfin.discovery.findBestServer(servers);

        if (!best) {
            setServerCheckError(t('could_not_find_server'));
            setCheckingServer(false);
            return;
        }

        console.log('Found server:', best.address);

        saveServerUrl(best.address);
        setServerUrl(best.address);
        setStep('login');
        setServerCheckError(null);
        setCheckingServer(false);
    };

    const onSubmitLogin = async (e: React.FormEvent) => {
        setLoggingIn(true);

        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const usernameInput = form.querySelector('#username') as HTMLInputElement;
        const passwordInput = form.querySelector('#password') as HTMLInputElement;
        const username = usernameInput?.value?.trim();
        const password = passwordInput?.value?.trim();

        if (!username) {
            setLoginError(t('enter_at_least_username'));
            setLoggingIn(false);
            return;
        }

        try {
            console.log('Attempting login for user:', username);
            console.log('Using server:', serverUrl || '');
            await login.mutateAsync({
                server: serverUrl || '',
                username,
                password,
            });
            setLoginError(null);
            setLoggingIn(false);

            console.log('Login successful');
            navigate('/', { replace: true });
        } catch (error) {
            setLoginError(t('login_failed'));
            setLoggingIn(false);
            console.error('Login error:', error);
        } finally {
            setLoggingIn(false);
        }
    };

    const onBackToServer = () => {
        setStep('server');
        setLoginError(null);
        setServerCheckError(null);
        saveServerUrl('');
        setServerUrl('');
    };

    return (
        <Page
            title={t('title')}
            className="flex items-center justify-center h-full w-full"
            bgItem={
                splashScreenUrl && branding?.SplashscreenEnabled ? (
                    <div className="fixed top-0 left-0 w-full h-full -z-20 overflow-hidden">
                        <div className="absolute inset-0">
                            <img
                                src={splashScreenUrl}
                                alt="Splash Screen"
                                className="w-full h-full object-cover blur-lg scale-110 opacity-40"
                            />
                        </div>
                        <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/50 to-background" />
                        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
                    </div>
                ) : undefined
            }
            showHeader={false}
        >
            {step === 'server' && (
                <Card className="max-w-md w-full mx-auto -translate-y-12">
                    <CardHeader className="flex flex-col items-center">
                        <div className="mb-1 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Server size={24} className="text-gray-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {t('connect_to_jellyfin')}
                        </CardTitle>
                        <CardDescription>{t('enter_server_address')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmitServer}>
                            <Label htmlFor="server-address" className="mb-2 block font-medium">
                                {t('server_address')}
                            </Label>
                            <Input
                                id="server-address"
                                type="text"
                                placeholder="jellyfin.example.com"
                                className="w-full"
                                autoCapitalize="none"
                                autoCorrect="off"
                                inputMode="url"
                                autoFocus
                            />
                            <p className="mt-2 text-xs text-muted-foreground">{t('no_http')}</p>
                            {serverCheckError && (
                                <p className="mt-2 text-sm text-destructive flex items-center gap-2">
                                    <TriangleAlert size={16} />
                                    {serverCheckError}
                                </p>
                            )}
                            <Button className="w-full mt-4" type="submit" disabled={checkingServer}>
                                {checkingServer ? (
                                    <>
                                        <Spinner />
                                        {t('connecting')}
                                    </>
                                ) : (
                                    t('connect')
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
            {step === 'login' && (
                <Card className="max-w-md w-full mx-auto -translate-y-12">
                    <CardHeader className="flex flex-col items-center">
                        <div className="mb-1 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={24} className="text-gray-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {t('login_to_jellyfin')}
                        </CardTitle>
                        <CardDescription>{t('enter_credentials')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isDemo && (
                            <div className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                <Info size={16} className="mt-0.5 shrink-0" />
                                <p className="text-sm">{t('demo_warning')}</p>
                            </div>
                        )}
                        <form onSubmit={onSubmitLogin}>
                            <Label htmlFor="username" className="mb-2 block font-medium">
                                {t('username')}
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder={t('username')}
                                className="mb-4 w-full"
                                autoFocus
                                defaultValue={isDemo ? DEMO_USERNAME : undefined}
                            />
                            <Label htmlFor="password" className="mb-2 block font-medium">
                                {t('password')}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={t('password')}
                                className="w-full"
                            />
                            {loginError && (
                                <p className="mt-4 text-sm text-destructive flex items-center gap-2">
                                    <TriangleAlert size={16} />
                                    {loginError}
                                </p>
                            )}
                            <Button className="mt-6 w-full" type="submit" disabled={loggingIn}>
                                {loggingIn ? (
                                    <>
                                        <Spinner />
                                        {t('logging_in')}
                                    </>
                                ) : (
                                    t('login')
                                )}
                            </Button>
                            <Button
                                className="mt-2 w-full"
                                variant="secondary"
                                onClick={() => setStep('quickconnect')}
                            >
                                {t('quick_connect')}
                            </Button>
                            <Button variant="link" className="w-full mt-2" onClick={onBackToServer}>
                                {t('back_to_server')}
                            </Button>
                        </form>
                        <Disclaimer text={branding?.LoginDisclaimer} />
                    </CardContent>
                </Card>
            )}
            {step === 'quickconnect' && (
                <Card className="max-w-md w-full mx-auto -translate-y-12">
                    <CardHeader className="flex flex-col items-center">
                        <div className="mb-1 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Server size={24} className="text-gray-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">{t('quick_connect')}</CardTitle>
                        <CardDescription className="text-center">
                            {t('quick_connect_description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {quickConnectInitiate.isPending && !quickConnectCode && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Spinner />
                                <p className="mt-4 text-sm text-muted-foreground">
                                    {t('quick_connect_initiated')}
                                </p>
                            </div>
                        )}

                        {quickConnectCode && (
                            <div className="flex flex-col items-center">
                                {/* <Label className="mb-2 text-center font-medium">
                                    {t('quick_connect_code')}
                                </Label> */}
                                <div className="text-4xl sm:text-5xl font-bold tracking-widest mb-4 p-4 bg-muted rounded-lg">
                                    {quickConnectCode.slice(0, 3)} {quickConnectCode.slice(3, 6)}
                                </div>
                                <p className="text-sm text-center text-muted-foreground mb-4">
                                    {t('quick_connect_instructions')}
                                </p>

                                {isPolling && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Spinner />
                                        {t('waiting_for_approval')}
                                    </div>
                                )}

                                {loggingIn && (
                                    <div className="flex items-center gap-2 text-sm text-primary">
                                        <Spinner />
                                        {t('quick_connect_approved')}
                                    </div>
                                )}
                            </div>
                        )}

                        {quickConnectError && (
                            <p className="mt-4 text-sm text-destructive flex items-center justify-center gap-2">
                                <TriangleAlert size={16} />
                                {quickConnectError}
                            </p>
                        )}

                        <Button
                            variant="link"
                            className="w-full mt-4"
                            onClick={() => {
                                setStep('login');
                                setQuickConnectCode(null);
                                setQuickConnectSecret(undefined);
                                setQuickConnectError(null);
                                setIsPolling(false);
                                setQuickConnectApproved(false);
                                initiatingQuickConnectRef.current = false;
                            }}
                            disabled={loggingIn}
                        >
                            {t('back_to_login')}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </Page>
    );
};

export default LoginPage;
