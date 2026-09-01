import { useTranslation } from 'react-i18next';
import LibrariesRow from '../components/home/LibrariesRow';
import ContinueWatchingRow from '@/components/home/ContinueWatchingRow';
import ResumeRow from '../components/home/ResumeRow';
import NextUpRow from '../components/home/NextUpRow';
import { useConfig, useUserViews, type DetailField } from '@pelagica/core';
import ItemsRow from '../components/home/ItemsRow';
import RecentlyAddedRow from '../components/home/RecentlyAddedRow';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models';
import GenresRow from '../components/home/GenresRow';
import RecommendedItemsRow from '../components/home/RecommendedItemsRow';
import StudiosRow from '../components/home/StudiosRow';
import MediaBarRow from '../components/home/MediaBarRow';
import {
    SeerrDiscoverSliderRow,
    SeerrPopularMoviesRow,
    SeerrPopularSeriesRow,
    SeerrTrendingRow,
} from '../components/home/SeerrDiscoverRows';
import { getHomerowItemLimit } from '../lib/limit-homerow-items';

function getDetailFieldsForCollectionType(type: CollectionType | undefined): DetailField[] {
    switch (type) {
        case 'music':
            return ['Artist'];
        case 'playlists':
            return ['TrackCount'];
        default:
            return ['ReleaseYear'];
    }
}

const Home = () => {
    const { t } = useTranslation('home');
    const { config } = useConfig();
    const { data: userViews } = useUserViews();

    return (
        <div className="flex flex-col items-start gap-6">
            {config.homeScreenSections?.map((section, index) => {
                if (section.enabled === false) return null;
                switch (section.type) {
                    case 'mediaBar':
                        return (
                            <MediaBarRow
                                key={index}
                                title={section.title}
                                size={section.size}
                                itemsConfig={section.items}
                                showFavoriteButton={section.showFavoriteButton}
                                showWatchlistButton={section.showWatchlistButton}
                                bleedTop={index === 0}
                            />
                        );
                    case 'continueWatching':
                        return (
                            <ContinueWatchingRow
                                key={index}
                                title={t('continue_watching')}
                                accurateSorting={section.accurateSorting}
                                titleLine={section.titleLine}
                                detailLine={section.detailLine}
                                limit={getHomerowItemLimit(section.limit)}
                            />
                        );
                    case 'resume':
                        return (
                            <ResumeRow
                                key={index}
                                title={t('resume')}
                                titleLine={section.titleLine}
                                detailLine={section.detailLine}
                                limit={getHomerowItemLimit(section.limit)}
                            />
                        );
                    case 'nextUp':
                        return (
                            <NextUpRow
                                key={index}
                                title={t('next_up')}
                                titleLine={section.titleLine}
                                detailLine={section.detailLine}
                                limit={getHomerowItemLimit(section.limit)}
                            />
                        );
                    case 'libraries':
                        return <LibrariesRow key={index} title={t('libraries')} />;
                    case 'recentlyAdded': {
                        const filteredViews =
                            section.libraryIds && section.libraryIds.length > 0
                                ? userViews?.Items?.filter(
                                      (view) => view.Id && section.libraryIds!.includes(view.Id)
                                  )
                                : userViews?.Items;
                        return (
                            <>
                                {userViews && filteredViews ? (
                                    <>
                                        {filteredViews.map((view) => (
                                            <RecentlyAddedRow
                                                key={view.Id}
                                                view={view}
                                                section={section}
                                                detailFields={getDetailFieldsForCollectionType(
                                                    view.CollectionType
                                                )}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    <p>Loading user views...</p>
                                )}
                            </>
                        );
                    }
                    case 'items':
                        return (
                            <ItemsRow
                                key={index}
                                title={section.title || t('items')}
                                items={section.items}
                                useThumbImage={section.useThumbImage}
                                detailFields={section.detailFields}
                            />
                        );
                    case 'genres':
                        return (
                            <GenresRow
                                key={index}
                                title={section.title || t('genres')}
                                limit={getHomerowItemLimit(section.limit)}
                            />
                        );
                    case 'streamystatsRecommended':
                        return (
                            <RecommendedItemsRow
                                key={index}
                                title={section.title || t('recommended_items')}
                                type={section.recommendationType}
                                limit={getHomerowItemLimit(section.limit)}
                                showSimilarity={section.showSimilarity}
                            />
                        );
                    case 'studios':
                        return (
                            <StudiosRow
                                key={index}
                                title={section.title || t('studios')}
                                limit={getHomerowItemLimit(section.limit)}
                            />
                        );
                    case 'seerrDiscover':
                        if (section.sliderId != null) {
                            return (
                                <SeerrDiscoverSliderRow
                                    key={index}
                                    sliderId={section.sliderId}
                                    title={section.title}
                                />
                            );
                        }
                        switch (section.variant) {
                            case 'popularMovies':
                                return (
                                    <SeerrPopularMoviesRow
                                        key={index}
                                        title={section.title || t('seerr_popular_movies')}
                                    />
                                );
                            case 'popularSeries':
                                return (
                                    <SeerrPopularSeriesRow
                                        key={index}
                                        title={section.title || t('seerr_popular_series')}
                                    />
                                );
                            case 'trending':
                            default:
                                return (
                                    <SeerrTrendingRow
                                        key={index}
                                        title={section.title || t('seerr_trending')}
                                    />
                                );
                        }
                    default:
                        return null;
                }
            })}
        </div>
    );
};

export default Home;
