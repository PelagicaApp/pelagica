import type { AppConfig } from '@/hooks/api/useConfig';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import BaseMediaPage from './BaseMediaPage';
import { useTranslation } from 'react-i18next';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import DetailBadges from './DetailBadges';
import { useState } from 'react';
import { useSeasons } from '@/hooks/api/useSeasons';
import EpisodesDisplay from './EpisodesDisplay';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PeopleRow from './PeopleRow';
import FavoriteButton from '../../components/FavoriteButton';
import { Skeleton } from '@/components/ui/skeleton';
import ItemAdminButton from '@/components/ItemAdminButton';
import { ImageOff } from 'lucide-react';
import { getUserId } from '../../utils/localstorageCredentials';
import PlayStateButton from '../../components/PlayStateButton';
import { useUpcomingEpisodes } from '../../hooks/api/useUpcomingEpisodes';
import UpcomingEpisodeComponent from './UpcomingEpisodeComponent';
import { getLogoUrl } from '@/utils/jellyfinUrls';
import ItemMetadataBadges from './ItemMetadataBadges';
import Overview from './Overview';
import ItemBackButton from './ItemBackButton';

interface SeasonPageProps {
    item: BaseItemDto;
    config: AppConfig;
    onBack?: () => void;
}

const SeasonPage = ({ item, config, onBack }: SeasonPageProps) => {
    const { t } = useTranslation('item');
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const { data: seasons, isLoading: isLoadingSeasons } = useSeasons(item.SeriesId || '');
    const [posterFailed, setPosterFailed] = useState(false);
    const { data: upcomingEpisodes } = useUpcomingEpisodes(item.Id || '');
    const [isPosterLoaded, setIsPosterLoaded] = useState(false);
    const [failedLogo, setFailedLogo] = useState(false);
    const [customAspectRatio, setCustomAspectRatio] = useState<number | null>(null);
    const [prevItemId, setPrevItemId] = useState<string | undefined>(item.Id);

    // 切换 item 时重置自定义宽高比，避免上一张图的 ratio 残留
    if (item.Id !== prevItemId) {
        setPrevItemId(item.Id);
        setCustomAspectRatio(null);
    }

    const currentAspectRatio = customAspectRatio ?? item.PrimaryImageAspectRatio ?? 2 / 3;

    const effectiveSelectedSeason =
        selectedSeason ||
        (seasons && seasons.length > 0
            ? seasons.find((s) => s.IndexNumber === item.IndexNumber)?.Id || seasons[0]?.Id || ''
            : '');

    return (
        <BaseMediaPage
            itemId={item.SeriesId || ''}
            name={item.SeriesName || item.Name || ''}
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
                        {!posterFailed ? (
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
                                        isPosterLoaded ? 'blur-0 opacity-100' : 'blur-md opacity-0',
                                    ].join(' ')}
                                    onLoad={(e) => {
                                        setIsPosterLoaded(true);
                                        const img = e.currentTarget;
                                        if (img.naturalWidth && img.naturalHeight) {
                                            setCustomAspectRatio(
                                                img.naturalWidth / img.naturalHeight
                                            );
                                        }
                                    }}
                                    onError={() => setPosterFailed(true)}
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
                            <FavoriteButton
                                item={item}
                                showFavoriteButton={
                                    item.Type &&
                                    config.itemPage?.favoriteButton?.includes(item.Type)
                                }
                            />

                            <PlayStateButton itemId={item.Id || ''} userId={getUserId() || ''} />

                            <ItemAdminButton item={item} />
                        </div>

                        <Overview text={item.Overview || ''} />

                        <ItemMetadataBadges item={item} />
                    </div>
                </div>

                {upcomingEpisodes && upcomingEpisodes.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-3xl font-bold">{t('upcoming_episodes')}</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {upcomingEpisodes.map((episode) => (
                                <UpcomingEpisodeComponent
                                    key={episode.Id}
                                    episode={episode}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <EpisodesDisplay
                        title={
                            <div className="flex flex-wrap items-center gap-4">
                                <h3 className="text-3xl font-bold">{t('episodes')}</h3>

                                {seasons && seasons.length > 1 && (
                                    <Select
                                        value={effectiveSelectedSeason || ''}
                                        onValueChange={(value) => setSelectedSeason(value || null)}
                                        disabled={
                                            isLoadingSeasons || !seasons || seasons.length === 0
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('select_season')} />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {seasons.map((season) => (
                                                <SelectItem key={season.Id} value={season.Id || ''}>
                                                    {season.Name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        }
                        seasonsLoading={isLoadingSeasons}
                        seriesId={item.SeriesId || null}
                        seasonId={effectiveSelectedSeason}
                        episodeDisplay={config.itemPage?.episodeDisplay || 'row'}
                    />
                </div>

                <PeopleRow
                    people={item.People || []}
                    title={<h3 className="text-3xl font-bold">{t('cast_and_crew')}</h3>}
                />
            </div>
        </BaseMediaPage>
    );
};

export default SeasonPage;
