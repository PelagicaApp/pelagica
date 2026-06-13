import { Skeleton } from '@/components/ui/skeleton';
import { usePageBackground } from '@/hooks/usePageBackground';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { memo, useEffect, useState } from 'react';
import Page from '../Page';
import { usePerson } from '@/hooks/api/usePerson';
import { getUserId } from '@/utils/localstorageCredentials';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import FilmographyRow from './FilmographyRow';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { ImageOff } from 'lucide-react';

const PersonPageSkeleton = memo(() => {
    return (
        <div className="relative h-full w-full">
            <div className="bg-background/30 backdrop-blur-md p-4 sm:p-8 rounded-md w-full flex flex-col gap-8">
                <div className="flex flex-col md:flex-row gap-6 max-w-7xl">
                    <div className="relative w-60 min-w-60 h-90 sm:w-72 sm:min-w-72 sm:h-108 hidden sm:block">
                        <Skeleton className="object-cover rounded-md w-full h-full" />
                    </div>
                    <div className="flex-1">
                        <Skeleton className="h-12 w-3/4 mb-4" />
                        <div className="space-y-2 mb-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                        <Skeleton className="h-5 w-64 mb-2" />
                        <Skeleton className="h-5 w-56 mb-2" />
                        <Skeleton className="h-5 w-72 mb-2" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-9 w-48" />
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="shrink-0">
                                <Skeleton className="w-40 h-60 rounded-md mb-2" />
                                <Skeleton className="h-4 w-36 mb-1" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

const DescriptionItem = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="flex flex-wrap gap-2 text-md mb-2">
            <p className="text-muted-foreground">{label}:</p>
            <p>{value}</p>
        </div>
    );
};

interface PersonPageProps {
    item: BaseItemDto;
    t: TFunction;
}

const PersonPageContent = ({ item, t }: PersonPageProps) => {
    const { setBackground } = usePageBackground();
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
    const [primaryImageError, setPrimaryImageError] = useState(false);

    useEffect(() => {
        setBackground(
            <div className="fixed top-0 left-0 w-full h-full -z-20 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={getPrimaryImageUrl(
                            item.Id || '',
                            { width: 400, height: 600 },
                            item.ImageTags?.Primary
                        )}
                        alt={item.Name + ' Backdrop'}
                        className="w-full h-full object-cover blur-3xl scale-110 opacity-40"
                    />
                </div>
                <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/50 to-background" />
                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
            </div>
        );

        return () => {
            setBackground(null);
        };
    }, [item.Id, item.Name, item.ImageTags?.Primary, setBackground]);

    const birthPlace = item.ProductionLocations
        ? item.ProductionLocations.filter(Boolean).join(', ')
        : null;

    return (
        <div className="relative h-full w-full">
            <div className="bg-background/30 backdrop-blur-md p-4 sm:p-8 rounded-md w-full flex flex-col gap-8">
                <div className="flex flex-col md:flex-row gap-6 max-w-7xl">
                    <div className="relative w-60 min-w-60 h-90 sm:w-72 sm:min-w-72 sm:h-108 hidden sm:block">
                        {!primaryImageError ? (
                            <>
                                <img
                                    src={getPrimaryImageUrl(
                                        item.Id || '',
                                        { width: 576, height: 864 },
                                        item.ImageTags?.Primary
                                    )}
                                    alt={item.Name + ' Primary'}
                                    className="object-cover rounded-md w-full h-full"
                                    onError={() => setPrimaryImageError(true)}
                                />
                                <Skeleton className="absolute inset-0 w-full h-full rounded-md -z-1" />
                            </>
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                                {item.Name ? (
                                    <span className="text-5xl font-bold text-muted-foreground">
                                        {item.Name.split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </span>
                                ) : (
                                    <ImageOff className="w-12 h-12 text-muted-foreground" />
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-bold mt-2 mb-4">{item.Name}</h2>
                        {item.Overview && (
                            <div className="mb-4">
                                <p
                                    className={`text-md ${!isOverviewExpanded ? 'line-clamp-5' : ''}`}
                                >
                                    {item.Overview}
                                </p>
                                <Button
                                    variant={'link'}
                                    className="p-0 h-auto text-sm"
                                    onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                                >
                                    {isOverviewExpanded ? t('show_less') : t('show_more')}
                                </Button>
                            </div>
                        )}
                        {item.PremiereDate && (
                            <DescriptionItem
                                label={t('born')}
                                value={new Date(item.PremiereDate).toLocaleDateString()}
                            />
                        )}
                        {item.EndDate && (
                            <DescriptionItem
                                label={t('died')}
                                value={new Date(item.EndDate).toLocaleDateString()}
                            />
                        )}
                        {birthPlace && (
                            <DescriptionItem label={t('birth_place')} value={birthPlace} />
                        )}
                    </div>
                </div>
                <FilmographyRow
                    personId={item.Id || ''}
                    title={<h3 className="text-3xl font-bold">{t('filmography')}</h3>}
                />
            </div>
        </div>
    );
};

const PersonPage = () => {
    const { t } = useTranslation('item');
    const params = useParams<{ itemId: string }>();
    const itemId = params.itemId;

    const { data: item, isLoading, error } = usePerson(itemId, getUserId() || undefined);

    return (
        <Page
            title={item ? `${item.Name}` : isLoading ? t('loading') : t('item_not_found')}
            className="min-h-full"
        >
            {isLoading && <PersonPageSkeleton />}
            {error && <p>Error loading item details.</p>}
            {item && <PersonPageContent item={item} t={t} />}
        </Page>
    );
};

export default PersonPage;
