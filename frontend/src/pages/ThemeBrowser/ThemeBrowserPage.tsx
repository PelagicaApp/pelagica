import { Button } from '@/components/ui/button';
import Page from '../Page';
import { Link } from 'react-router';
import { ArrowLeft, CloudCheck, DownloadCloud, ExternalLink, Info } from 'lucide-react';
import { useThemesRepository } from '@/hooks/api/themes/useThemesRepository';
import { Card } from '@/components/ui/card';
import { getRepositoryThemeUrl, getThemePreviewUrl } from '@/api/repositoryThemes';
import { useThemes } from '@/hooks/api/themes/useThemes';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { useInstallTheme } from '@/hooks/api/themes/useInstallTheme';
import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { memo } from 'react';

const ThemeCardSkeleton = memo(() => {
    return (
        <Card className="p-0 gap-0 overflow-hidden">
            <Skeleton className="w-full h-48 rounded-none" />

            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />

                <Skeleton className="h-4 w-1/3" />

                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />

                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-9" />
                </div>
            </div>
        </Card>
    );
});
ThemeCardSkeleton.displayName = 'ThemeCardSkeleton';

const ThemeGridSkeleton = memo(({ count = 8 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ThemeCardSkeleton key={i} />
            ))}
        </div>
    );
});
ThemeGridSkeleton.displayName = 'ThemeGridSkeleton';

const ThemeBrowserPage = () => {
    const { t } = useTranslation('themebrowser');
    const { data: themesRepo, isLoading: isLoadingRepo, isError } = useThemesRepository();
    const { data: themes, isLoading: isLoadingThemes } = useThemes();
    const { mutate: installTheme } = useInstallTheme();
    const [installingId, setInstallingId] = useState<string | null>(null);

    const handleInstall = (id: string) => {
        setInstallingId(id);

        installTheme(id, {
            onSettled: () => {
                setInstallingId(null);
            },
        });
    };

    return (
        <Page title={t('theme_browser')}>
            <div className="flex items-center gap-3 mb-3 mt-2">
                <Button variant="outline" size="icon-sm" asChild>
                    <Link to="/settings?tab=themes">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">{t('themes')}</h1>
            </div>
            <p className="mb-4 text-muted-foreground text-sm border-l-border border-l-3 pl-2">
                <Info className="inline mr-1.5 -mt-0.5 h-4 w-4" />
                <Trans
                    i18nKey="themebrowser:repository_info"
                    components={{
                        repoLink: (
                            <a
                                href="https://github.com/KartoffelChipss/pelagica-themes"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            />
                        ),
                    }}
                />
            </p>
            {(isLoadingRepo || isLoadingThemes) && <ThemeGridSkeleton count={7} />}
            {isError && <p>Error loading themes.</p>}
            {themesRepo && themes && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {themesRepo.themes.map((theme) => (
                        <Card key={theme.id} className="p-0 gap-0">
                            <Carousel
                                opts={{
                                    loop: true,
                                }}
                            >
                                <CarouselContent>
                                    {theme.previews.map((_, index) => (
                                        <CarouselItem key={index}>
                                            <img
                                                src={getThemePreviewUrl(theme, index)}
                                                alt={`${theme.name} preview ${index + 1}`}
                                                className="w-full h-48 object-cover"
                                            />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {theme.previews.length > 1 && (
                                    <>
                                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                                    </>
                                )}
                            </Carousel>
                            <div className="p-4">
                                <h2 className="text-lg font-semibold">{theme.name}</h2>
                                <p className="text-sm text-muted-foreground mb-1">{theme.author}</p>
                                <p className="text-sm mb-3">{theme.description}</p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        disabled={
                                            themes.some((t) => t.id === theme.id) ||
                                            installingId === theme.id
                                        }
                                        variant={'default'}
                                        className="hover:cursor-pointer"
                                        onClick={() => handleInstall(theme.id)}
                                    >
                                        {themes.some((t) => t.id === theme.id) ? (
                                            <>
                                                <CloudCheck />
                                                {t('installed')}
                                            </>
                                        ) : installingId === theme.id ? (
                                            <>
                                                <Spinner />
                                                {t('installing')}
                                            </>
                                        ) : (
                                            <>
                                                <DownloadCloud />
                                                {t('install')}
                                            </>
                                        )}
                                    </Button>
                                    <Button variant={'outline'} size={'icon'} asChild>
                                        <a
                                            href={getRepositoryThemeUrl(theme)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </Page>
    );
};

export default ThemeBrowserPage;
