import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import BaseMediaPage from './BaseMediaPage';
import { getPrimaryImageUrl, getLogoUrl } from '@/utils/jellyfinUrls';
import { ImageOff, Play } from 'lucide-react';
import PeopleRow from './PeopleRow';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import MoreLikeThisRow from './MoreLikeThisRow';
import type { AppConfig } from '@/hooks/api/useConfig';
import DetailBadges from './DetailBadges';
import MediaInfoDialog from '../../components/MediaInfoDialog';
import FavoriteButton from '../../components/FavoriteButton';
import WatchListButton from '../../components/WatchlistButton';
import PlayStateButton from '../../components/PlayStateButton';
import { getUserId } from '@/utils/localstorageCredentials';
import ItemAdminButton from '@/components/ItemAdminButton';
import { useState } from 'react';
import { TrailerButton } from '../../components/TrailerButton';
import ItemDownloadButton from '../../components/ItemDownloadButton';
import SourcePickerButton from '@/components/SourcePickerButton';
import ItemMetadataBadges from './ItemMetadataBadges';
import Overview from './Overview';
import { Link } from 'react-router';
import ItemBackButton from './ItemBackButton';

interface MoviePageProps {
    item: BaseItemDto;
    config: AppConfig;
    onBack?: () => void;
}

const MoviePage = ({ item, config, onBack }: MoviePageProps) => {
    const { t } = useTranslation('item');
    const [postersFailed, setPostersFailed] = useState(false);
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

    const isCurrentlyPlaying =
        item.UserData?.PlaybackPositionTicks &&
        item.UserData.PlaybackPositionTicks > 0 &&
        item.RunTimeTicks &&
        item.UserData.PlaybackPositionTicks < item.RunTimeTicks;

    return (
        <BaseMediaPage
            itemId={item.Id || ''}
            name={item.Name || ''}
            showLogo={false}
            topPadding={false}
        >
            <div className="pt-24 sm:pt-32 pb-12 mx-auto w-full flex flex-col gap-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch lg:items-start relative z-10 w-full">
                    {/* Left Column (Poster) */}
                    <div
                        className="relative -mx-4 sm:mx-auto lg:mx-0 w-[calc(100%+2rem)] sm:w-full sm:max-w-[24rem] lg:max-w-[30rem] xl:max-w-[36rem] shadow-lg overflow-hidden group shrink-0 bg-black/30"
                        style={{ aspectRatio: currentAspectRatio }}
                    >
                        {!postersFailed ? (
                            <Link to={`/play/${item.Id}`} className="block w-full h-full relative cursor-pointer z-10">
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
                                    onError={() => setPostersFailed(true)}
                                />
                                {/* 半透明大播放按钮 */}
                                <div className="absolute inset-0 bg-black/15 md:bg-black/25 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                                    <div className="h-16 w-16 bg-white/25 md:bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl">
                                        <Play className="h-8 w-8 text-white fill-white ml-1" />
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <ImageOff className="text-muted-foreground w-12 h-12" />
                            </div>
                        )}
                        {onBack && <ItemBackButton onClick={onBack} />}
                    </div>

                    {/* Right Column (Details) */}
                    <div className="flex-1 flex flex-col gap-5 w-full text-left">
                        {/* Title Logo / Text */}
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

                        {/* Badges */}
                        <DetailBadges item={item} appConfig={config} />

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2.5 items-center mt-2">
                            <SourcePickerButton
                                itemId={item.Id || ''}
                                mediaSources={item.MediaSources}
                                isCurrentlyPlaying={Boolean(isCurrentlyPlaying)}
                                playLabel={t('play')}
                                resumeLabel={t('resume')}
                            />
                            <TrailerButton item={item} />
                            <FavoriteButton
                                item={item}
                                showFavoriteButton={
                                    item.Type &&
                                    config.itemPage?.favoriteButton?.includes(item.Type)
                                }
                            />
                            <WatchListButton
                                item={item}
                                showWatchlistButton={config.itemPage?.showWatchlistButton}
                            />
                            <PlayStateButton itemId={item.Id || ''} userId={getUserId() || ''} />
                            <ItemDownloadButton
                                item={item}
                                showDownloadButton={config.itemPage?.showDownloadButton}
                            />
                            <MediaInfoDialog streams={item.MediaStreams || []} path={item.Path} />
                            <ItemAdminButton item={item} showSubtitlesButton={true} />
                        </div>

                        <Overview text={item.Overview || ''} />

                        <ItemMetadataBadges item={item} />
                    </div>
                </div>

                <PeopleRow
                    title={<h3 className="text-3xl font-bold">{t('cast_and_crew')}</h3>}
                    people={item.People || []}
                />
                <MoreLikeThisRow
                    title={<h3 className="text-3xl font-bold">{t('more_like_this')}</h3>}
                    itemId={item.Id || ''}
                />
            </div>
        </BaseMediaPage>
    );
};

export default MoviePage;
