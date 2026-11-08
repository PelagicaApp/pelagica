import { useState } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@pelagica/core';
import { useSeerrLogin } from '@pelagica/core';
import { useSeerrQuickConnectLogin, useSeerrQuickConnectSupported } from '@pelagica/core';
import { getServerUrl } from '@pelagica/core';

export const SeerrLoginDialog = ({ trigger }: { trigger: React.ReactNode }) => {
    const { t } = useTranslation(['sidebar', 'login']);
    const { data: user } = useCurrentUser();
    const seerrLogin = useSeerrLogin();
    const seerrQuickConnectLogin = useSeerrQuickConnectLogin();
    const { data: supportsQuickConnect } = useSeerrQuickConnectSupported();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            setPassword('');
            seerrLogin.reset();
            seerrQuickConnectLogin.reset();
        }
    };

    const isPending = seerrLogin.isPending || seerrQuickConnectLogin.isPending;

    const onLoginSuccess = () => {
        handleOpenChange(false);
        toast.success(t('seerr_login_success'));
    };

    const handleQuickConnect = () => {
        if (isPending) return;
        seerrLogin.reset();
        seerrQuickConnectLogin.mutate(undefined, { onSuccess: onLoginSuccess });
    };

    const handleSubmit = () => {
        const server = getServerUrl();
        if (!server || !user?.Name || !password || isPending) return;

        seerrQuickConnectLogin.reset();
        seerrLogin.mutate({ server, username: user.Name, password }, { onSuccess: onLoginSuccess });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('seerr_login_title')}</DialogTitle>
                    <DialogDescription>{t('seerr_login_description')}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    {supportsQuickConnect && (
                        <Button onClick={handleQuickConnect} disabled={isPending}>
                            {seerrQuickConnectLogin.isPending
                                ? t('logging_in')
                                : t('login:sign_in_with_quick_connect')}
                        </Button>
                    )}
                    <div>
                        <Label className="mb-2 text-sm font-medium">{t('username')}</Label>
                        <Input
                            placeholder={t('username') || ''}
                            value={user?.Name || ''}
                            disabled
                            readOnly
                        />
                    </div>
                    <div>
                        <Label className="mb-2 text-sm font-medium">{t('password')}</Label>
                        <Input
                            type="password"
                            placeholder={t('password') || ''}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
                            autoFocus
                        />
                    </div>
                    {seerrLogin.isError && (
                        <p className="text-sm text-destructive">{t('seerr_login_failed')}</p>
                    )}
                    {seerrQuickConnectLogin.isError && (
                        <p className="text-sm text-destructive">
                            {t('login:quick_connect_failed')}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || !password}
                        variant={supportsQuickConnect ? 'outline' : 'default'}
                    >
                        {seerrLogin.isPending ? t('logging_in') : t('login')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
