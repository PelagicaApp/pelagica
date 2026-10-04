import type React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ExternalLink,
    ShieldCheck,
    Bug,
    Globe,
    Monitor,
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
import { ExternalAnchor } from './ExternalAnchor';
import { VERSION } from '@/utils/version';
import { useTheme } from '@/components/theme-provider';
import { getEffectiveTheme } from '@/utils/effectiveTheme';
import { withBasePath, useConfig } from '@pelagica/core';
import { isDesktopApp } from '@/utils/desktopApp';
import '@/i18n/aboutTranslations';

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
    const { t } = useTranslation('about');
    const { config } = useConfig();
    const { theme } = useTheme();
    const effectiveTheme = getEffectiveTheme(theme);
    const isDesktop = isDesktopApp();

    const defaultLogo = withBasePath(effectiveTheme === 'dark' ? '/logo.svg' : '/logo-dark.svg');
    const configuredLogo =
        effectiveTheme === 'dark' ? config?.logoDarkUrl || '' : config?.logoLightUrl || '';
    const logoSrc = configuredLogo || defaultLogo;

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md p-6 gap-6">
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
                        <p className="text-xs text-muted-foreground max-w-xs">{t('tagline')}</p>
                    </div>

                    {/* Platform & License Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <Badge
                            variant="outline"
                            className="h-7 text-xs gap-1.5 rounded-full text-muted-foreground border-border"
                        >
                            {isDesktop ? (
                                <>
                                    <Monitor className="h-3.5 w-3.5" />
                                    {t('platform_desktop')}
                                </>
                            ) : (
                                <>
                                    <Globe className="h-3.5 w-3.5" />
                                    {t('platform_web')}
                                </>
                            )}
                        </Badge>

                        <Badge
                            variant="outline"
                            className="h-7 text-xs gap-1 rounded-full text-muted-foreground border-border"
                        >
                            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            GPL-3.0
                        </Badge>
                    </div>
                </DialogHeader>

                {/* Useful Links */}
                <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 space-y-2">
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full justify-between h-9 text-xs"
                    >
                        <ExternalAnchor href="https://github.com/PelagicaApp/pelagica">
                            <span className="flex items-center gap-2">
                                <GitHubIcon className="h-4 w-4" />
                                GitHub
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </ExternalAnchor>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full justify-between h-9 text-xs"
                    >
                        <ExternalAnchor href="https://github.com/PelagicaApp/pelagica/releases">
                            <span className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                {t('releases')}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </ExternalAnchor>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full justify-between h-9 text-xs"
                    >
                        <ExternalAnchor href="https://github.com/PelagicaApp/pelagica/issues">
                            <span className="flex items-center gap-2">
                                <Bug className="h-4 w-4" />
                                {t('issues')}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </ExternalAnchor>
                    </Button>
                </div>

                {/* Footer Credits */}
                <div className="text-center text-[11px] text-muted-foreground">
                    <p>{t('credits')}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
