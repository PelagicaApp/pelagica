import type { AppConfig } from '@/hooks/api/useConfig';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import BaseMediaPage from './BaseMediaPage';
import DetailBadges from './DetailBadges';
import { Skeleton } from '@/components/ui/skeleton';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { useState } from 'react';
import { useBoxSetItems } from '@/hooks/api/useBoxSetItems';
import SectionScroller from '@/components/SectionScroller';
import { useTranslation } from 'react-i18next';
import ScrollableSectionPoster from '@/components/ScrollableSectionPoster';
import ItemAdminButton from '@/components/ItemAdminButton';
import { ImageOff } from 'lucide-react';
import { getLogoUrl } from '@/utils/jellyfinUrls';
import Overview from './Overview';
import ItemMetadataBadges from './ItemMetadataBadges';
import ItemBackButton from './ItemBackButton';

interface BoxSetPageProps {
    item: BaseItemDto;
    config: AppConfig;
    onBack?: () => void;
}

const BoxSetPage = ({ item, config, onBack }: BoxSetPageProps) => {
    const { t } = useTranslation('item');
    const [primaryImageError, setPrimaryImageError] = useState(false);
    const { data: boxSetItems } = useBoxSetItems(item.Id || '');
    const [isPosterLoaded, setIsPosterLoaded] = useState(false);
    const [failedLogo, setFailedLogo] = useState(false);
    const [customAspectRatio, setCustomAspectRatio] = useState<number | null>(null);
    const [prevItemId, setPrevItemId] = useState<string | undefined>(item.Id);

    // 切换 item 时重置自定义宽高比，避免上一张图的 ratio 残留
    if (item.Id !== prevItemId) {
        setPrevItemId(item.Id);
        setCustomAspectRatio(null);
    }

    const currentAspectRatio = customAspectRatio ?? item.PrimaryImageAspectRatio ?? (2 / 3);

    return (
        <BaseMediaPage
            itemId={item.Id || ''}
            name={item.Name || ''}
            showLogo={false}
            topPadding={false}
        >
            <div className="pt-24 sm:pt-32 pb-12 mx-auto w-full flex flex-col gap-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch lg:items-start relative z-10 w-full">
                    {/* Poster */}
                    <div
                        className="relative -mx-4 sm:mx-auto lg:mx-0 w-[calc(100%+2rem)] sm:w-full sm:max-w-[24rem] lg:max-w-[30rem] xl:max-w-[36rem] shadow-lg overflow-hidden group shrink-0 bg-black/30"
                        style={{ aspectRatio: currentAspectRatio }}
                    >
                        {!primaryImageError ? (
                            <>
                                <Skeleton className="absolute inset-0 w-full h-full" />
                                <img
                                    src={getPrimaryImageUrl(
                                        item.Id || '',
                                        undefined,
                                        item.ImageTags?.Primary
                                    )}
                                    alt={item.Name + ' Primary'}
                                    className={[
                                        'object-cover w-full h-full relative z-10 bg-black/20',
                                        'transition-[filter,opacity] duration-700 ease-out',
                                        isPosterLoaded
                                            ? 'blur-0 opacity-100'
                                            : 'blur-md opacity-0',
                                    ].join(' ')}
                                    onLoad={(e) => {
                                        setIsPosterLoaded(true);
                                        const img = e.currentTarget;
                                        if (img.naturalWidth && img.naturalHeight) {
                                            setCustomAspectRatio(img.naturalWidth / img.naturalHeight);
                                        }
                                    }}
                                    onError={() => setPrimaryImageError(true)}
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <ImageOff className="text-muted-foreground w-12 h-12" />
                            </div>
                        )}
                        {onBack && <ItemBackButton onClick={onBack} />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col gap-5 w-full text-left">
                        {!failedLogo && item.Id ? (
                            <img
                                src={getLogoUrl(item.Id, { maxHeight: 150 }, item.ImageTags?.Logo)}
                                alt={item.Name || ''}
                                className="h-16 sm:h-24 md:h-28 max-w-[85%] object-contain object-left mb-2"
                                onError={() => setFailedLogo(true)}
                            />
                        ) : (
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-2 text-wrap balance">
                                {item.Name}
                            </h1>
                        )}

                        <DetailBadges item={item} appConfig={config} />

                        <div className="flex flex-wrap gap-2.5 items-center mt-2">
                            <ItemAdminButton item={item} />
                        </div>

                        <Overview text={item.Overview || ''} />

                        <ItemMetadataBadges item={item} />
                    </div>
                </div>

                <SectionScroller
                    title={<h3 className="text-3xl font-bold">{t('boxSetItems')}</h3>}
                    items={
                        boxSetItems?.map((boxSetItem) => (
                            <ScrollableSectionPoster key={boxSetItem.Id} item={boxSetItem}>
                                {boxSetItem.PremiereDate && (
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {new Date(boxSetItem.PremiereDate).getFullYear()}
                                    </span>
                                )}
                            </ScrollableSectionPoster>
                        )) ||
                        Array.from({ length: 10 }, (_, i) => (
                            <div
                                key={i}
                                className="group min-w-48 lg:min-w-64 2xl:min-w-80 animate-pulse"
                            >
                                <Skeleton className="w-full aspect-video rounded-md" />
                                <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
                            </div>
                        ))
                    }
                />
            </div>
        </BaseMediaPage>
    );
};

export default BoxSetPage;
