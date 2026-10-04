import { useState, useEffect } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle2,
    Download,
    ExternalLink,
    RefreshCw,
    Sparkles,
    AlertCircle,
    ShieldCheck,
    FlaskConical,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { ExternalAnchor } from './ExternalAnchor';
import { VERSION } from '@/utils/version';
import { useTheme } from '@/components/theme-provider';
import { getEffectiveTheme } from '@/utils/effectiveTheme';
import { withBasePath, useConfig } from '@pelagica/core';
import { useAppUpdater, formatBytes } from '@/utils/updater';

const GitHubIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
    </svg>
);

export const AboutDialog = ({ trigger }: { trigger: React.ReactNode }) => {
    const { i18n } = useTranslation('sidebar');
    const isTurkish = i18n.language?.startsWith('tr');
    const { config } = useConfig();
    const { theme } = useTheme();
    const effectiveTheme = getEffectiveTheme(theme);
    const [open, setOpen] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);

    const defaultLogo = withBasePath(effectiveTheme === 'dark' ? '/logo.svg' : '/logo-dark.svg');
    const configuredLogo =
        effectiveTheme === 'dark' ? config?.logoDarkUrl || '' : config?.logoLightUrl || '';
    const logoSrc = configuredLogo || defaultLogo;

    const {
        state,
        updateInfo,
        progress,
        bytesDownloaded,
        totalBytes,
        errorMessage,
        isSimulated,
        checkForUpdates,
        startDownloadAndInstall,
        simulateUpdate,
        resetToCurrent,
    } = useAppUpdater();

    useEffect(() => {
        if (open && state === 'idle') {
            checkForUpdates();
        }
    }, [open, state, checkForUpdates]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 gap-6">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    {/* App Logo */}
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
                        <Avatar className="h-14 w-14 rounded-xl">
                            <AvatarImage src={logoSrc} alt="Pelagica" className="object-contain" />
                            <AvatarFallback className="rounded-xl font-bold text-lg text-primary">
                                PE
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
                        </span>
                    </div>

                    {/* App Title & Version */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                Pelagica
                            </DialogTitle>
                            <Badge
                                variant="secondary"
                                className="font-mono text-xs font-semibold px-2"
                            >
                                v{VERSION}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            {isTurkish
                                ? 'Jellyfin için modern, zarif ve performanslı medya istemcisi'
                                : 'A modern, beautiful, and high-performance Jellyfin client'}
                        </p>
                    </div>

                    {/* Quick Badges & Links */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-7 text-xs gap-1.5 rounded-full"
                        >
                            <ExternalAnchor href="https://github.com/PelagicaApp/pelagica">
                                <GitHubIcon className="h-3.5 w-3.5" />
                                GitHub
                            </ExternalAnchor>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-7 text-xs gap-1.5 rounded-full"
                        >
                            <ExternalAnchor href="https://github.com/PelagicaApp/pelagica/releases">
                                <ExternalLink className="h-3.5 w-3.5" />
                                {isTurkish ? 'Sürüm Notları' : 'Releases'}
                            </ExternalAnchor>
                        </Button>

                        <Badge
                            variant="outline"
                            className="h-7 text-xs gap-1 rounded-full text-muted-foreground border-border"
                        >
                            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            GPL-3.0
                        </Badge>
                    </div>
                </DialogHeader>

                {/* Auto Update Section */}
                <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">
                                {isTurkish ? 'Otomatik Güncelleme' : 'Auto Updater'}
                            </span>
                        </div>

                        {state !== 'downloading' && state !== 'installing' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => checkForUpdates()}
                                disabled={state === 'checking'}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <RefreshCw
                                    className={`h-3 w-3 mr-1 ${state === 'checking' ? 'animate-spin' : ''}`}
                                />
                                {isTurkish ? 'Denetle' : 'Check'}
                            </Button>
                        )}
                    </div>

                    {/* Update Status Views */}
                    {state === 'checking' && (
                        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                            <Spinner className="h-4 w-4" />
                            <span>
                                {isTurkish
                                    ? 'En yeni sürümler denetleniyor...'
                                    : 'Checking for updates...'}
                            </span>
                        </div>
                    )}

                    {state === 'up-to-date' && (
                        <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <div className="text-xs">
                                <p className="font-medium">
                                    {isTurkish
                                        ? 'Pelagica güncel!'
                                        : 'You are on the latest version!'}
                                </p>
                                <p className="text-muted-foreground text-[11px]">
                                    {isTurkish
                                        ? `v${VERSION} sürümünü kullanıyorsunuz.`
                                        : `Currently running v${VERSION}.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-medium">
                                    {isTurkish ? 'Güncelleme hatası' : 'Update check failed'}
                                </p>
                                <p className="text-muted-foreground text-[11px]">
                                    {errorMessage ||
                                        (isTurkish
                                            ? 'GitHub bağlantısı kurulamadı.'
                                            : 'Could not reach GitHub.')}
                                </p>
                            </div>
                        </div>
                    )}

                    {(state === 'update-available' ||
                        state === 'downloading' ||
                        state === 'downloaded' ||
                        state === 'installing') &&
                        updateInfo && (
                            <div className="space-y-3 pt-1">
                                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-primary text-primary-foreground font-semibold text-xs">
                                            {isTurkish ? 'Yeni Sürüm Mevcut' : 'New Version'}
                                        </Badge>
                                        <span className="font-mono text-xs font-bold text-primary">
                                            v{updateInfo.version}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {updateInfo.installerSize
                                                ? formatBytes(updateInfo.installerSize)
                                                : 'Windows AMD64 Installer'}
                                        </span>
                                        {updateInfo.releaseNotes && (
                                            <button
                                                type="button"
                                                onClick={() => setShowChangelog(!showChangelog)}
                                                className="flex items-center gap-0.5 text-primary hover:underline text-[11px] cursor-pointer"
                                            >
                                                {isTurkish ? 'Değişiklikler' : 'Changelog'}
                                                {showChangelog ? (
                                                    <ChevronUp className="h-3 w-3" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {showChangelog && updateInfo.releaseNotes && (
                                        <div className="mt-2 p-2 rounded bg-background/80 border text-[11px] font-sans text-muted-foreground max-h-28 overflow-y-auto whitespace-pre-line leading-relaxed">
                                            {updateInfo.releaseNotes}
                                        </div>
                                    )}
                                </div>

                                {/* Download & Install Progress */}
                                {(state === 'downloading' ||
                                    state === 'downloaded' ||
                                    state === 'installing') && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>
                                                {state === 'downloading' &&
                                                    (isTurkish
                                                        ? 'Güncelleme indiriliyor...'
                                                        : 'Downloading update...')}
                                                {state === 'downloaded' &&
                                                    (isTurkish
                                                        ? 'İndirme tamamlandı!'
                                                        : 'Download complete!')}
                                                {state === 'installing' &&
                                                    (isTurkish
                                                        ? 'Kurulum başlatılıyor...'
                                                        : 'Launching installer...')}
                                            </span>
                                            <span className="font-mono text-primary font-bold">
                                                %{progress}
                                            </span>
                                        </div>

                                        {/* Styled Progress Bar */}
                                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between text-[11px] text-muted-foreground">
                                            <span>
                                                {formatBytes(bytesDownloaded)} /{' '}
                                                {formatBytes(totalBytes)}
                                            </span>
                                            <span>
                                                {state === 'installing' &&
                                                    (isTurkish
                                                        ? 'Pelagica güncelleniyor...'
                                                        : 'Installing...')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {state === 'update-available' && (
                                    <Button
                                        className="w-full gap-2 font-medium"
                                        onClick={() => startDownloadAndInstall()}
                                    >
                                        <Download className="h-4 w-4" />
                                        {isTurkish ? 'Şimdi Güncelle ve Kur' : 'Update & Install'}
                                    </Button>
                                )}

                                {state === 'installing' && (
                                    <Button disabled className="w-full gap-2 font-medium">
                                        <Spinner className="h-4 w-4" />
                                        {isTurkish
                                            ? 'Kurucu Başlatılıyor...'
                                            : 'Launching Installer...'}
                                    </Button>
                                )}
                            </div>
                        )}

                    {/* Developer Test Tools (Subtle toolbar for testing UI states) */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <FlaskConical className="h-3 w-3" />
                            {isTurkish ? 'Geliştirici Testi:' : 'Dev Preview:'}
                        </span>
                        <div className="flex gap-1.5">
                            {!isSimulated ? (
                                <button
                                    type="button"
                                    onClick={() => simulateUpdate('4.12.0')}
                                    className="px-2 py-0.5 rounded bg-muted hover:bg-accent text-foreground text-[10px] font-medium transition cursor-pointer"
                                >
                                    {isTurkish ? 'Yeni Sürümü Simüle Et' : 'Simulate Update'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => resetToCurrent()}
                                    className="px-2 py-0.5 rounded bg-muted hover:bg-accent text-foreground text-[10px] font-medium transition cursor-pointer"
                                >
                                    {isTurkish ? 'Mevcut Sürüme Dön' : 'Reset'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="text-center text-[11px] text-muted-foreground">
                    <p>
                        {isTurkish
                            ? 'Pelagica açık kaynak topluluğu tarafından geliştirildi ❤️'
                            : 'Crafted with ❤️ by the Pelagica open source community'}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
