import Page from '../Page';
import { useUserViews } from '@/hooks/api/useUserViews';
import { useConfig, type DetailField } from '@/hooks/api/useConfig';
import MediaBar from './MediaBar';
import ItemsRow from './ItemsRow';
import ContinueWatchingRow from './ContinueWatchingRow';
import { useTranslation } from 'react-i18next';
import RecommendedItemsRow from './RecommendedItemsRow';
import NextUpRow from './NextUpRow';
import ResumeRow from './ResumeRow';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models';
import GenresRow from './GenresRow';
import LibrariesRow from './LibrariesRow';
import StudiosRow from './StudiosRow';
import RecentlyAddedRow from './RecentlyAddedRow';

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

const HomePage = () => {
    const { t } = useTranslation('home');
    const { data: userViews } = useUserViews();
    const { config } = useConfig();

    const firstEnabledSection = config.homeScreenSections?.find(
        (section) => section.enabled !== false
    );
    const firstSectionIsMediaBar = firstEnabledSection?.type === 'mediaBar';

    return (
        <Page
            title={config?.serverName || 'Pelagica'}
            requiresAuth={true}
            overlayHeader={firstSectionIsMediaBar}
            pagePadding={false}
        >
            <div className="flex flex-col gap-4 pb-4">
                {config.homeScreenSections?.map((section, index) => {
                    if (section.enabled === false) return null;

                    switch (section.type) {
                        case 'studios':
                            return (
                                <StudiosRow
                                    key={index}
                                    title={section.title || t('studios')}
                                    limit={section.limit}
                                />
                            );
                        case 'libraries':
                            return (
                                <LibrariesRow key={index} title={section.title || t('libraries')} />
                            );

                        case 'continueWatching':
                            return (
                                <ContinueWatchingRow
                                    key={index}
                                    title={section.title || t('continue_watching')}
                                    titleLine={section.titleLine}
                                    detailLine={
                                        section.detailLine !== undefined
                                            ? section.detailLine
                                            : ['TimeRemaining']
                                    }
                                    limit={section.limit || 20}
                                    accurateSorting={section.accurateSorting}
                                />
                            );

                        case 'nextUp':
                            return (
                                <NextUpRow
                                    key={index}
                                    title={section.title || t('next_up')}
                                    titleLine={section.titleLine}
                                    detailLine={
                                        section.detailLine !== undefined
                                            ? section.detailLine
                                            : ['TimeRemaining']
                                    }
                                    limit={section.limit || 20}
                                />
                            );

                        case 'resume':
                            return (
                                <ResumeRow
                                    key={index}
                                    title={section.title || t('resume')}
                                    titleLine={section.titleLine}
                                    detailLine={
                                        section.detailLine !== undefined
                                            ? section.detailLine
                                            : ['TimeRemaining']
                                    }
                                    limit={section.limit || 20}
                                />
                            );

                        case 'mediaBar':
                            return (
                                <MediaBar
                                    key={index}
                                    size={section.size}
                                    itemsConfig={section.items}
                                    title={index != 0 ? section.title : undefined}
                                    showFavoriteButton={section.showFavoriteButton}
                                    showWatchlistButton={section.showWatchlistButton}
                                    fadeTop={index != 0}
                                />
                            );

                        case 'recentlyAdded':
                            return (
                                <div key={index} className="flex flex-col gap-4">
                                    {userViews && userViews.Items ? (
                                        <>
                                            {userViews.Items.map((view) => (
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
                                </div>
                            );

                        case 'items':
                            return (
                                <ItemsRow
                                    key={index}
                                    title={section.title}
                                    allLink={section.allLink}
                                    items={section.items}
                                    detailFields={
                                        section.detailFields && section.detailFields.length > 0
                                            ? section.detailFields
                                            : ['ReleaseYear']
                                    }
                                />
                            );

                        case 'streamystatsRecommended':
                            return (
                                <RecommendedItemsRow
                                    key={index}
                                    title={section.title || t('recommended_for_you')}
                                    type={section.recommendationType}
                                    limit={section.limit}
                                    showSimilarity={section.showSimilarity}
                                    showBasedOn={section.showBasedOn}
                                />
                            );

                        case 'genres':
                            return (
                                <GenresRow
                                    key={index}
                                    title={section.title || t('genres')}
                                    limit={section.limit}
                                />
                            );

                        default:
                            return null;
                    }
                })}
            </div>
        </Page>
    );
};

export default HomePage;
