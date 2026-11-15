import type { AppConfig } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getPrimaryImageUrl, getUserId, usePlaylistItems } from '@pelagica/core';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { ImageOff, Play, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildPlayerUrl } from '@/utils/playerUrl';
import BaseMediaPage from './BaseMediaPage';
import DetailBadges from './DetailBadges';
import Overview from './Overview';
import ItemMetadataBadges from './ItemMetadataBadges';
import { Skeleton } from '@/components/ui/skeleton';
import ScrollableSectionPoster from '@/components/ScrollableSectionPoster';
import ItemAdminButton from '@/components/ItemAdminButton';

interface PlaylistPageProps {
    item: BaseItemDto;
    config: AppConfig;
}

function getPlaylistEntryDetail(entry: BaseItemDto): string | undefined {
    if (entry.Type === 'Episode') {
        const episode =
            entry.ParentIndexNumber != null && entry.IndexNumber != null
                ? `S${entry.ParentIndexNumber} E${entry.IndexNumber}`
                : undefined;
        return [entry.SeriesName, episode].filter(Boolean).join(' · ') || undefined;
    }
    if (entry.ProductionYear) return entry.ProductionYear.toString();
    if (entry.PremiereDate) return new Date(entry.PremiereDate).getFullYear().toString();
    return undefined;
}

function isPlayableEntry(entry: BaseItemDto): boolean {
    return !!entry.Id && entry.Type !== 'Photo';
}

const PlaylistPage = ({ item, config }: PlaylistPageProps) => {
    const { t } = useTranslation('item');
    const [primaryImageError, setPrimaryImageError] = useState(false);
    const [isPosterLoaded, setIsPosterLoaded] = useState(false);
    const { data: entries, isLoading } = usePlaylistItems(item.Id, getUserId());
    const location = useLocation();
    const navigate = useNavigate();
    const backUrl = location.pathname + location.search;

    const playableEntries = useMemo(() => entries?.filter(isPlayableEntry) ?? [], [entries]);
    const nextEntry =
        playableEntries.find((entry) => !entry.UserData?.Played) ?? playableEntries[0];

    const handleShuffle = () => {
        if (!playableEntries.length) return;
        const randomEntry = playableEntries[Math.floor(Math.random() * playableEntries.length)];
        navigate(buildPlayerUrl(randomEntry.Id!, backUrl));
    };

    return (
        <BaseMediaPage
            itemId={item.Id || ''}
            name={item.Name || ''}
            showLogo={false}
            topPadding={false}
        >
            <div className="pt-24 sm:pt-32 pb-12 mx-auto w-full flex flex-col gap-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start relative z-10 w-full">
                    {/* Poster */}
                    <div className="w-48 sm:w-64 md:w-72 lg:w-80 shrink-0 mx-auto lg:mx-0">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl shadow-black/85 border border-white/10 bg-muted flex items-center justify-center">
                            {!primaryImageError ? (
                                <>
                                    <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />
                                    <img
                                        src={getPrimaryImageUrl(
                                            item.Id || '',
                                            { width: 640, height: 640 },
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
                                        onError={() => setPrimaryImageError(true)}
                                    />
                                </>
                            ) : (
                                <ImageOff className="text-muted-foreground w-12 h-12" />
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col gap-5 w-full text-left">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-2 text-wrap balance">
                            {item.Name}
                        </h1>

                        <DetailBadges item={item} appConfig={config} />

                        <div className="flex flex-wrap gap-2.5 items-center mt-2">
                            {nextEntry ? (
                                <Button
                                    className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 ease-out"
                                    asChild
                                >
                                    <Link to={buildPlayerUrl(nextEntry.Id!, backUrl)}>
                                        <Play />
                                        {t('play')}
                                    </Link>
                                </Button>
                            ) : (
                                <Button className="w-fit" disabled>
                                    <Play />
                                    {isLoading ? t('loading') : t('play')}
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                className="w-fit"
                                onClick={handleShuffle}
                                disabled={!playableEntries.length}
                            >
                                <Shuffle />
                                {t('shuffle')}
                            </Button>
                            <ItemAdminButton item={item} />
                        </div>

                        <Overview text={item.Overview || ''} />

                        <ItemMetadataBadges item={item} />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="text-3xl font-bold">{t('playlist_items')}</h3>
                    <div className="flex flex-wrap items-start gap-4">
                        {isLoading
                            ? Array.from({ length: 10 }, (_, i) => (
                                  <div key={i} className="w-36 lg:w-44 2xl:w-52 animate-pulse">
                                      <Skeleton className="w-full aspect-2/3 rounded-md" />
                                      <Skeleton className="mt-2 h-4 w-3/4 rounded-md" />
                                  </div>
                              ))
                            : entries?.map((entry) => {
                                  const detail = getPlaylistEntryDetail(entry);
                                  return (
                                      <ScrollableSectionPoster
                                          key={entry.PlaylistItemId || entry.Id}
                                          item={entry}
                                          forceLandscape={entry.Type === 'Episode'}
                                      >
                                          {detail && (
                                              <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                  {detail}
                                              </span>
                                          )}
                                      </ScrollableSectionPoster>
                                  );
                              })}
                    </div>
                </div>
            </div>
        </BaseMediaPage>
    );
};

export default PlaylistPage;
