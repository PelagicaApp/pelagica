import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    getJellyfinInstance,
    getServerUrl,
    saveServerUrl,
    useLogin,
    useQuickConnectAuthenticate,
    useQuickConnectInitiate,
    useQuickConnectStatus,
    useServerAddress,
} from '@pelagica/core';
import FocusableButton from '@/components/FocusableButton';
import FocusableField from '@/components/FocusableField';
import { AlertTriangle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getQuickConnectUrl } from '@/utils/quickConnectUrl';
import { Card, CardContent } from '@/components/ui/card';

type Step = 'server' | 'method' | 'quickconnect' | 'password';

const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center gap-1 text-sm text-destructive">
        <AlertTriangle className="inline-block mr-1 w-4 h-4" />
        <p>{message}</p>
    </div>
);

const Login = () => {
    const { t } = useTranslation(['login', 'common']);
    const navigate = useNavigate();
    const predefinedServerAddress = useServerAddress();

    const [serverUrl, setServerUrl] = useState<string>(() => getServerUrl() || '');
    const [step, setStep] = useState<Step>(() => (getServerUrl() ? 'method' : 'server'));
    const [checkingServer, setCheckingServer] = useState(false);
    const [serverCheckError, setServerCheckError] = useState<string | null>(null);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();
    const [loginError, setLoginError] = useState<string | null>(null);

    const quickConnectInitiate = useQuickConnectInitiate();
    const quickConnectAuthenticate = useQuickConnectAuthenticate();
    const [quickConnectSecret, setQuickConnectSecret] = useState<string | undefined>(undefined);
    const [quickConnectCode, setQuickConnectCode] = useState<string | null>(null);
    const [quickConnectError, setQuickConnectError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [quickConnectApproved, setQuickConnectApproved] = useState(false);
    const initiatingRef = useRef(false);

    const quickConnectStatus = useQuickConnectStatus(serverUrl, quickConnectSecret, isPolling);

    // A server pre-configured by the deployment (e.g. bundled with the Pelagica
    // backend) means the user never has to type a server address on the TV.
    useEffect(() => {
        if (!predefinedServerAddress?.trim() || getServerUrl()) return;
        saveServerUrl(predefinedServerAddress);
        setServerUrl(predefinedServerAddress);
        setStep('method');
    }, [predefinedServerAddress]);

    const onSubmitServer = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setCheckingServer(true);
            setServerCheckError(null);

            const input = String(new FormData(e.currentTarget).get('server') ?? '').trim();
            if (!input) {
                setServerCheckError(t('login:please_enter_server_address'));
                setCheckingServer(false);
                return;
            }

            try {
                const servers =
                    await getJellyfinInstance().discovery.getRecommendedServerCandidates(input);
                const best = getJellyfinInstance().discovery.findBestServer(servers);
                if (!best) {
                    setServerCheckError(t('login:could_not_find_server'));
                    return;
                }
                saveServerUrl(best.address);
                setServerUrl(best.address);
                setStep('method');
            } finally {
                setCheckingServer(false);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [t]
    );

    const initiateQuickConnect = useCallback(async () => {
        setQuickConnectError(null);
        try {
            const result = await quickConnectInitiate.mutateAsync(serverUrl);
            if (result.Code && result.Secret) {
                setQuickConnectCode(result.Code);
                setQuickConnectSecret(result.Secret);
                setIsPolling(true);
            } else {
                setQuickConnectError(t('login:quick_connect_unavailable'));
            }
        } catch {
            setQuickConnectError(t('login:quick_connect_unavailable'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverUrl]);

    useEffect(() => {
        if (step === 'quickconnect' && !quickConnectCode && !initiatingRef.current) {
            initiatingRef.current = true;
            initiateQuickConnect().finally(() => {
                initiatingRef.current = false;
            });
        }
    }, [step, quickConnectCode, initiateQuickConnect]);

    useEffect(() => {
        if (!quickConnectStatus.data?.Authenticated || !quickConnectSecret || quickConnectApproved)
            return;

        setQuickConnectApproved(true);
        setIsPolling(false);

        quickConnectAuthenticate
            .mutateAsync({ server: serverUrl, secret: quickConnectSecret })
            .then(() => navigate('/', { replace: true }))
            .catch(() => {
                setQuickConnectError(t('login:quick_connect_auth_failed'));
                setQuickConnectApproved(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        quickConnectStatus.data,
        quickConnectSecret,
        quickConnectApproved,
        serverUrl,
        quickConnectAuthenticate,
        navigate,
    ]);

    const onSubmitPassword = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setLoginError(null);
            try {
                await login.mutateAsync({ server: serverUrl, username, password });
                navigate('/', { replace: true });
            } catch {
                setLoginError(t('login:invalid_credentials'));
            }
        },
        [serverUrl, username, password, login, navigate, t]
    );

    const quickConnectUrl = getQuickConnectUrl(quickConnectCode);

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6">
            <div className="flex flex-col items-center gap-2">
                <img src="logo.svg" alt="Pelagica logo" className="h-8 w-8" />
                <h1 className="text-2xl font-semibold">Pelagica</h1>
            </div>

            {step === 'server' && (
                <form onSubmit={onSubmitServer} className="flex w-full max-w-sm flex-col gap-3">
                    <label className="text-sm text-muted-foreground" htmlFor="server">
                        {t('login:server_address')}
                    </label>
                    <FocusableField
                        id="server"
                        name="server"
                        placeholder="jellyfin.example.com"
                        autoFocus
                    />
                    {serverCheckError && <ErrorMessage message={serverCheckError} />}
                    <FocusableButton type="submit" disabled={checkingServer}>
                        {checkingServer ? t('login:connecting') : t('login:connect')}
                    </FocusableButton>
                </form>
            )}

            {step === 'method' && (
                <div className="flex w-full max-w-sm flex-col gap-3">
                    <FocusableButton autoFocus onClick={() => setStep('quickconnect')}>
                        {t('login:sign_in_with_quick_connect')}
                    </FocusableButton>
                    <FocusableButton variant="outline" onClick={() => setStep('password')}>
                        {t('login:sign_in_with_password')}
                    </FocusableButton>
                    {!predefinedServerAddress && (
                        <FocusableButton
                            variant="ghost"
                            onClick={() => {
                                setStep('server');
                                setServerCheckError(null);
                            }}
                        >
                            {t('login:use_different_server')}
                        </FocusableButton>
                    )}
                </div>
            )}

            {step === 'quickconnect' && (
                <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
                    {quickConnectUrl && (
                        <Card className="py-2">
                            <CardContent className="px-2">
                                <div className="flex items-center justify-center bg-white p-2 rounded-md">
                                    <QRCode value={quickConnectUrl} />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <p className="text-4xl font-semibold tracking-[0.3em]">
                        {quickConnectCode ?? '……'}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        {t('login:quick_connect_qr_instructions', { server: serverUrl })}
                    </p>
                    {quickConnectError && <ErrorMessage message={quickConnectError} />}
                    <FocusableButton
                        autoFocus
                        variant="secondary"
                        onClick={() => {
                            setIsPolling(false);
                            setQuickConnectCode(null);
                            setQuickConnectSecret(undefined);
                            setQuickConnectError(null);
                            setStep('method');
                        }}
                    >
                        {t('common:back')}
                    </FocusableButton>
                </div>
            )}

            {step === 'password' && (
                <form onSubmit={onSubmitPassword} className="flex w-full max-w-sm flex-col gap-3">
                    <label className="text-sm text-muted-foreground" htmlFor="username">
                        {t('login:username')}
                    </label>
                    <FocusableField
                        id="username"
                        placeholder={t('login:username')}
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <label className="text-sm text-muted-foreground" htmlFor="password">
                        {t('login:password')}
                    </label>
                    <FocusableField
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {loginError && <ErrorMessage message={loginError} />}
                    <FocusableButton type="submit" disabled={login.isPending}>
                        {login.isPending ? t('login:logging_in') : t('login:login')}
                    </FocusableButton>
                    <FocusableButton variant="ghost" onClick={() => setStep('method')}>
                        {t('common:back')}
                    </FocusableButton>
                </form>
            )}
        </div>
    );
};

export default Login;
