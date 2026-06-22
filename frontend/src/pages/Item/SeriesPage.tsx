import { Button } from '@/components/ui/button';
import { useSeasons } from '@/hooks/api/useSeasons';
import { getPrimaryImageUrl, getLogoUrl } from '@/utils/jellyfinUrls';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ImageOff, Play } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { buildPlayerUrl } from '@/utils/playerUrl';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEpisodes } from '@/hooks/api/useEpisodes';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import PeopleRow from './PeopleRow';
import BaseMediaPage from './BaseMediaPage';
import MoreLikeThisRow from './MoreLikeThisRow';
import { type AppConfig } from '@/hooks/api/useConfig';
import DetailBadges from './DetailBadges';
import EpisodesDisplay from './EpisodesDisplay';
import FavoriteButton from '../../components/FavoriteButton';
import WatchListButton from '../../components/WatchlistButton';
import PlayStateButton from '../../components/PlayStateButton';
import { getUserId } from '@/utils/localstorageCredentials';
import ItemAdminButton from '@/components/ItemAdminButton';
import { TrailerButton } from '../../components/TrailerButton';
import { useUpcomingEpisodes } from '../../hooks/api/useUpcomingEpisodes';
import UpcomingEpisodeComponent from './UpcomingEpisodeComponent';
import ItemMetadataBadges from './ItemMetadataBadges';
import Overview from './Overview';

interface SeriesPageProps {
    item: BaseItemDto;
    config: AppConfig;
}

const SeriesPage = ({ item, config }: SeriesPageProps) => {
    const { t } = useTranslation('item');
    const location = useLocation();
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const { data: seasons, isLoading, error } = useSeasons(item.Id || '');
    const [posterFailed, setPosterFailed] = useState(false);
    const [isPosterLoaded, setIsPosterLoaded] = useState(false);
    const [failedLogo, setFailedLogo] = useState(false);

    const { data: upcomingEpisodes } = useUpcomingEpisodes(item.Id || '');

    const effectiveSelectedSeason =
        selectedSeason ||
        (seasons && seasons.length > 0
            ? seasons.find((s) => s.IndexNumber === 1)?.Id || seasons[0]?.Id || ''
            : '');

    const firstSeasonId =
        seasons && seasons.length > 0
            ? seasons.find((s) => s.IndexNumber === 1)?.Id || seasons[0]?.Id
            : undefined;
    const { data: firstSeasonEpisodes } = useEpisodes(item.Id || null, firstSeasonId);

    const episodeToContinue =
        firstSeasonEpisodes?.find(
            (ep) => !ep.UserData?.Played || (ep.UserData?.PlaybackPositionTicks ?? 0) > 0
        ) || firstSeasonEpisodes?.[0];

    return (
        <BaseMediaPage
            itemId={item.Id || ''}
            name={item.Name || ''}
            showLogo={false}
            topPadding={false}
        >
            <div className="pt-24 sm:pt-32 pb-12 mx-auto w-full flex flex-col gap-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start relative z-10 w-full">
                    {/* Left Column (Poster) */}
                    <div className="w-48 sm:w-64 md:w-72 lg:w-80 shrink-0 mx-auto lg:mx-0">
                        <div className="relative aspect-2/3 w-full rounded-xl overflow-hidden shadow-2xl shadow-black/85 border border-white/10 bg-muted flex items-center justify-center">
                            {!posterFailed ? (
                                <>
                                    <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />
                                    <img
                                        src={getPrimaryImageUrl(
                                            item.Id || '',
                                            { width: 640, height: 960 },
                                            item.ImageTags?.Primary
                                        )}
                                        alt={item.Name + ' Primary'}
                                        className={[
                                            'object-cover rounded-xl w-full h-full relative z-10',
                                            'transition-[filter,opacity] duration-700 ease-out',
                                            isPosterLoaded
                                                ? 'blur-0 opacity-100'
                                                : 'blur-md opacity-0',
                                        ].join(' ')}
                                        onLoad={() => setIsPosterLoaded(true)}
                                        onError={() => setPosterFailed(true)}
                                    />
                                </>
                            ) : (
                                <ImageOff className="text-muted-foreground w-12 h-12" />
                            )}
                        </div>
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
                            {episodeToContinue ? (
                                <Button
                                    className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 ease-out"
                                    asChild
                                >
                                    <Link
                                        to={buildPlayerUrl(
                                            episodeToContinue.Id!,
                                            location.pathname + location.search
                                        )}
                                    >
                                        <Play />
                                        {episodeToContinue.UserData?.PlaybackPositionTicks
                                            ? t('continue_episode', {
                                                  season: episodeToContinue.ParentIndexNumber,
                                                  episode: episodeToContinue.IndexNumber,
                                              })
                                            : t('play_episode', {
                                                  season: episodeToContinue.ParentIndexNumber,
                                                  episode: episodeToContinue.IndexNumber,
                                              })}
                                    </Link>
                                </Button>
                            ) : (
                                <Button className="w-fit" disabled>
                                    <Play />
                                    {t('loading')}
                                </Button>
                            )}
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
                                        disabled={isLoading || !seasons || seasons.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('select_season')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {seasons?.map((season) => (
                                                <SelectItem key={season.Id} value={season.Id || ''}>
                                                    {season.Name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        }
                        seasonsLoading={isLoading}
                        seriesId={item.Id || null}
                        seasonId={effectiveSelectedSeason}
                        episodeDisplay={config.itemPage?.episodeDisplay || 'row'}
                    />
                    {error && (
                        <p className="text-destructive">
                            Error loading seasons: {(error as Error).message}
                        </p>
                    )}
                </div>

                <PeopleRow
                    title={<h3 className="text-3xl font-bold">{t('cast_and_crew')}</h3>}
                    people={item.People || []}
                    loading={isLoading}
                />
                <MoreLikeThisRow
                    title={<h3 className="text-3xl font-bold">{t('more_like_this')}</h3>}
                    itemId={item.Id || ''}
                />
            </div>
        </BaseMediaPage>
    );
};

export default SeriesPage;
