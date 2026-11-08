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
import { useChangePassword, useCurrentUser } from '@pelagica/core';

export const ChangePasswordDialog = ({ trigger }: { trigger: React.ReactNode }) => {
    const { t } = useTranslation('sidebar');
    const { data: user } = useCurrentUser();
    const changePassword = useChangePassword();
    const [open, setOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const hasPassword = user?.HasPassword !== false;
    const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
    const canSubmit =
        !!user?.Id &&
        (!hasPassword || currentPassword.length > 0) &&
        newPassword.length > 0 &&
        newPassword === confirmPassword &&
        !changePassword.isPending;

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            changePassword.reset();
        }
    };

    const handleSubmit = () => {
        if (!canSubmit || !user?.Id) return;
        changePassword.mutate(
            { userId: user.Id, currentPassword, newPassword },
            {
                onSuccess: () => {
                    handleOpenChange(false);
                    toast.success(t('change_password_success'));
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('change_password')}</DialogTitle>
                    <DialogDescription>{t('change_password_description')}</DialogDescription>
                </DialogHeader>
                <form
                    id="change-password-form"
                    className="flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    {/* this should help password managers */}
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={user?.Name || ''}
                        readOnly
                        hidden
                    />
                    {hasPassword && (
                        <div>
                            <Label htmlFor="current-password" className="mb-2 text-sm font-medium">
                                {t('current_password')}
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="new-password" className="mb-2 text-sm font-medium">
                            {t('new_password')}
                        </Label>
                        <Input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoFocus={!hasPassword}
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirm-password" className="mb-2 text-sm font-medium">
                            {t('confirm_new_password')}
                        </Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            aria-invalid={mismatch || undefined}
                        />
                    </div>
                    {mismatch && (
                        <p className="text-sm text-destructive">{t('passwords_do_not_match')}</p>
                    )}
                    {changePassword.isError && (
                        <p className="text-sm text-destructive">{t('change_password_failed')}</p>
                    )}
                </form>
                <DialogFooter>
                    <Button type="submit" form="change-password-form" disabled={!canSubmit}>
                        {changePassword.isPending ? t('changing_password') : t('change_password')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
