import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ExternalLink, Flag, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PELAGICA_PLUGIN_REPO_URL } from '@/api/pelagicaPlugin';
import type { PelagicaPluginStatus } from '@/hooks/api/usePelagicaPluginStatus';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '../../../components/ui/empty';
import { ExternalAnchor } from '@/components/ExternalAnchor';

interface PluginRequiredNoticeProps {
    status: Extract<PelagicaPluginStatus, 'not-installed' | 'needs-restart'>;
    installing: boolean;
    restarting: boolean;
    onInstall: () => void;
    onRestart: () => void;
}

export const PluginRequiredNotice = ({
    status,
    installing,
    restarting,
    onInstall,
    onRestart,
}: PluginRequiredNoticeProps) => {
    const { t } = useTranslation('settings');
    const [restartDialogOpen, setRestartDialogOpen] = useState(false);

    return status === 'needs-restart' ? (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <RotateCw />
                </EmptyMedia>
                <EmptyTitle>{t('plugin_restart_title')}</EmptyTitle>
                <EmptyDescription>{t('plugin_restart_description')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={restarting}>
                            {restarting && <Loader2 className="animate-spin" />}
                            {t('plugin_restart_button')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('plugin_restart_confirm_title')}</DialogTitle>
                            <DialogDescription>
                                {t('plugin_restart_confirm_description')}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="destructive"
                                disabled={restarting}
                                onClick={() => {
                                    setRestartDialogOpen(false);
                                    onRestart();
                                }}
                            >
                                {restarting && <Loader2 className="animate-spin" />}
                                {t('plugin_restart_confirm_button')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </EmptyContent>
        </Empty>
    ) : (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Flag />
                </EmptyMedia>
                <EmptyTitle>{t('plugin_required_title')}</EmptyTitle>
                <EmptyDescription>{t('plugin_required_description')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Button variant="outline" asChild>
                    <ExternalAnchor href={PELAGICA_PLUGIN_REPO_URL}>
                        <ExternalLink />
                        {t('plugin_install_instructions_button')}
                    </ExternalAnchor>
                </Button>
                <Button onClick={onInstall} disabled={installing}>
                    {installing ? <Loader2 className="animate-spin" /> : <Download />}
                    {t('plugin_install_button')}
                </Button>
            </EmptyContent>
        </Empty>
    );
};
