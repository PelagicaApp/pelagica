import { getRecentlyAddedItemTypes, isSupportedLibrary } from '@pelagica/core';
import type { DetailField, LibraryView, RecentlyAddedSection } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import ItemsRow from './ItemsRow';

interface RecentlyAddedRowProps {
    view: LibraryView;
    section: RecentlyAddedSection;
    detailFields?: DetailField[];
}

const RecentlyAddedRow = ({ view, section, detailFields }: RecentlyAddedRowProps) => {
    const { t } = useTranslation('home');

    if (!isSupportedLibrary(view)) {
        return null;
    }

    return (
        <>
            {view.Id && view.Name && (
                <ItemsRow
                    title={t('recently_added', {
                        category: view.Name,
                    })}
                    items={{
                        // Recently-added rows are recursive, unlike folder browsing.
                        libraryId: view.Id,
                        sortBy: ['DateCreated'],
                        sortOrder: 'Descending',
                        limit: section.limit || 10,
                        types: getRecentlyAddedItemTypes(view.CollectionType),
                    }}
                    detailFields={detailFields}
                    libraryView={view}
                />
            )}
        </>
    );
};

export default RecentlyAddedRow;
