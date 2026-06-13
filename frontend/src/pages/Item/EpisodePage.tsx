import type { AppConfig } from '@/hooks/api/useConfig';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import BaseMediaPage from './BaseMediaPage';
import { Dot, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPrimaryImageUrl, getThumbUrl } from '@/utils/jellyfinUrls';
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
import JellyfinItemKindIcon from '@/components/JellyfinItemKindIcon';
import MediaInfoDialog from '../../components/MediaInfoDialog';
import FavoriteButton from '../../components/FavoriteButton';
import { getUserId } from '@/utils/localstorageCredentials';
import PlayStateButton from '../../components/PlayStateButton';
import ItemAdminButton from '@/components/ItemAdminButton';
import ItemDownloadButton from '../../components/ItemDownloadButton';
import SourcePickerButton from '@/components/SourcePickerButton';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import Overview from './Overview';

interface EpisodePageProps {
    item: BaseItemDto;
    config: AppConfig;
}

const EpisodePage = ({ item, config }: EpisodePageProps) => {
    const { t } = useTranslation('item');
    const [imageError, setImageError] = useState<boolean>(false);
    const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const { data: seasons, isLoading: isLoadingSeasons } = useSeasons(item.SeriesId || '');

    const effectiveSelectedSeason =
        selectedSeason ||
        (seasons && seasons.length > 0
            ? seasons.find((s) => s.IndexNumber === item.ParentIndexNumber)?.Id ||
              seasons[0]?.Id ||
              ''
            : '');

    const watched = item.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = item.RunTimeTicks ?? 0;
    const progress = runtime > 0 ? (watched / runtime) * 100 : 0;
    const isCurrentlyPlaying = watched > 0 && runtime > 0 && watched < runtime;

    return (
        <BaseMediaPage
            itemId={item.SeriesId || ''}
            name={item.SeriesName || item.Name || ''}
            showLogo={false}
            topPadding={false}
        >
            <div className="pt-24 sm:pt-32 pb-12 mx-auto w-full flex flex-col gap-12">
                {/* Hero Row */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start relative z-10 w-full">
                    {/* Left Column (Thumbnail) */}
                    <div className="w-full sm:w-72 md:w-96 lg:w-120 shrink-0 mx-auto lg:mx-0">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/85 border border-white/10 bg-muted flex items-center justify-center">
                            {imageError ? (
                                <ImageOff className="w-12 h-12 text-muted-foreground" />
                            ) : (
                                <>
                                    <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />
                                    <img
                                        src={
                                            item.SeriesId
                                                ? getPrimaryImageUrl(
                                                      item.Id!,
                                                      { width: 800 },
                                                      item.ImageTags?.Primary
                                                  )
                                                : getThumbUrl(
                                                      item.Id!,
                                                      { width: 800 },
                                                      item.ImageTags?.Thumb
                                                  )
                                        }
                                        alt={item.Name || t('no_title')}
                                        className={[
                                            'w-full h-full object-cover relative z-10',
                                            'transition-[filter,opacity] duration-700 ease-out',
                                            isImageLoaded
                                                ? 'blur-0 opacity-100'
                                                : 'blur-md opacity-0',
                                        ].join(' ')}
                                        onLoad={() => setIsImageLoaded(true)}
                                        onError={() => setImageError(true)}
                                    />
                                </>
                            )}
                            {progress > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                                    <div
                                        style={{ width: `${progress}%` }}
                                        className="h-full bg-brand transition-width"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Details) */}
                    <div className="flex-1 flex flex-col gap-5 w-full text-left">
                        {/* Breadcrumb */}
                        <div className="flex flex-wrap items-center text-sm text-muted-foreground">
                            <Link
                                to={`/item/${item.SeriesId}`}
                                className="hover:underline flex items-center gap-2"
                            >
                                <JellyfinItemKindIcon kind="Series" className="h-4 w-4" />
                                <span className="line-clamp-1 text-ellipsis break-all">
                                    {item.SeriesName || t('no_title')}
                                </span>
                            </Link>
                            <Dot />
                            <Link
                                to={`/item/${item.ParentId}`}
                                className="hover:underline line-clamp-1 text-ellipsis break-all"
                            >
                                {t('season_x', { number: item.ParentIndexNumber || 0 })}
                            </Link>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight -mt-2 text-wrap balance">
                            {item.Name}
                        </h1>

                        <DetailBadges item={item} appConfig={config} />

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2.5 items-center mt-2">
                            <SourcePickerButton
                                itemId={item.Id || ''}
                                mediaSources={item.MediaSources}
                                isCurrentlyPlaying={isCurrentlyPlaying}
                                playLabel={t('play')}
                                resumeLabel={t('resume')}
                            />
                            <FavoriteButton
                                item={item}
                                showFavoriteButton={
                                    item.Type &&
                                    config.itemPage?.favoriteButton?.includes(item.Type)
                                }
                            />
                            <PlayStateButton itemId={item.Id || ''} userId={getUserId() || ''} />
                            <ItemDownloadButton
                                item={item}
                                showDownloadButton={config.itemPage?.showDownloadButton}
                            />
                            <MediaInfoDialog streams={item.MediaStreams || []} />
                            <ItemAdminButton item={item} showSubtitlesButton={true} />
                        </div>

                        <Overview text={item.Overview || ''} />
                    </div>
                </div>

                {/* Episodes Section */}
                <EpisodesDisplay
                    title={
                        <div className="flex items-center gap-4">
                            <h3 className="text-3xl font-bold">{t('episodes')}</h3>
                            {seasons && seasons.length > 1 && (
                                <Select
                                    value={effectiveSelectedSeason || ''}
                                    onValueChange={(value) => setSelectedSeason(value || null)}
                                    disabled={isLoadingSeasons || !seasons || seasons.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('select_season')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {seasons?.map((season) => (
                                            <SelectItem
                                                key={season.Id}
                                                value={season.Id || ''}
                                                onSelect={() =>
                                                    setSelectedSeason(season.Id || null)
                                                }
                                            >
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

                {/* Cast & Crew */}
                <PeopleRow
                    people={item.People || []}
                    title={<h3 className="text-3xl font-bold">{t('cast_and_crew')}</h3>}
                />
            </div>
        </BaseMediaPage>
    );
};

export default EpisodePage;
