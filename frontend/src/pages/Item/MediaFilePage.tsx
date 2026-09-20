import { useState } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getDownloadurl, getPrimaryImageUrl, useCurrentUser, type AppConfig } from '@pelagica/core';
import { Download, ImageOff, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { toPlaybackTrack } from '@/utils/musicPlaybackTrack';
import BaseMediaPage from './BaseMediaPage';
import DetailBadges from './DetailBadges';
import ItemMetadataBadges from './ItemMetadataBadges';
import Overview from './Overview';

export default function MediaFilePage({ item, config }: { item: BaseItemDto; config: AppConfig }) {
    const { t } = useTranslation(['item', 'common']);
    const { data: user } = useCurrentUser();
    const { loadQueue } = useMusicPlayback();
    const [imageError, setImageError] = useState(false);
    const isAudio = item.Type === 'Audio' || item.Type === 'AudioBook';
    const canPlay =
        isAudio && user?.Policy?.EnableMediaPlayback === true && item.PlayAccess !== 'None';
    const canDownload = Boolean(
        item.Id &&
        user?.Policy?.EnableContentDownloading === true &&
        item.CanDownload !== false &&
        config.itemPage?.showDownloadButton !== false
    );

    return (
        <BaseMediaPage
            itemId={item.Id || ''}
            name={item.Name || ''}
            showLogo={false}
            topPadding={false}
        >
            <div className="pt-24 sm:pt-32 pb-12 w-full flex flex-col sm:flex-row items-start gap-8">
                <div className="w-48 sm:w-64 shrink-0 aspect-2/3 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    {item.ImageTags?.Primary && !imageError ? (
                        <img
                            src={getPrimaryImageUrl(
                                item.Id!,
                                { width: 640 },
                                item.ImageTags.Primary
                            )}
                            alt={item.Name || ''}
                            className="w-full h-full object-contain"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <ImageOff className="w-12 h-12 text-muted-foreground" />
                    )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-5">
                    <h1 className="text-3xl sm:text-5xl font-bold">{item.Name}</h1>
                    <DetailBadges item={item} appConfig={config} />
                    <div className="flex flex-wrap gap-2">
                        {canPlay && item.Id && (
                            <Button onClick={() => loadQueue([toPlaybackTrack(item)], 0, true)}>
                                <Play />
                                {t('item:play')}
                            </Button>
                        )}
                        {canDownload && (
                            <Button variant="outline" asChild>
                                <a
                                    href={getDownloadurl(item.Id!)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download />
                                    {t('common:download')}
                                </a>
                            </Button>
                        )}
                    </div>
                    {!canPlay && (
                        <p className="text-muted-foreground">{t('item:playback_unavailable')}</p>
                    )}
                    {!canDownload && (
                        <p className="text-muted-foreground">{t('item:download_unavailable')}</p>
                    )}
                    <Overview text={item.Overview || ''} />
                    <ItemMetadataBadges item={item} />
                </div>
            </div>
        </BaseMediaPage>
    );
}
