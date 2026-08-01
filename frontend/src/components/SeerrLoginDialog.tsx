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
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { useSeerrLogin } from '@/hooks/api/useSeerrLogin';
import { getServerUrl } from '@/utils/localstorageCredentials';

export const SeerrLoginDialog = ({ trigger }: { trigger: React.ReactNode }) => {
    const { t } = useTranslation('sidebar');
    const { data: user } = useCurrentUser();
    const seerrLogin = useSeerrLogin();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            setPassword('');
            seerrLogin.reset();
        }
    };

    const handleSubmit = () => {
        const server = getServerUrl();
        if (!server || !user?.Name || !password || seerrLogin.isPending) return;

        seerrLogin.mutate(
            { server, username: user.Name, password },
            {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success(t('seerr_login_success'));
                },
            }
        );
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
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={seerrLogin.isPending || !password}>
                        {seerrLogin.isPending ? t('logging_in') : t('login')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
