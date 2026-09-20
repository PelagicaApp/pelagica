import ItemsRow from './ItemsRow';
import { useTranslation } from 'react-i18next';
import {
    getRecentlyAddedItemTypes,
    isSupportedLibrary,
    type DetailField,
    type LibraryView,
    type RecentlyAddedSection,
} from '@pelagica/core';

interface RecentlyAddedRowProps {
    view: LibraryView;
    section: RecentlyAddedSection;
    detailFields?: DetailField[];
}

const RecentlyAddedRow = ({ view, section, detailFields }: RecentlyAddedRowProps) => {
    const { t } = useTranslation('home');

    if (!isSupportedLibrary(view) || view.CollectionType === 'livetv') {
        return null;
    }

    return (
        <div key={view.Id} data-library-id={view.Id}>
            {view.Id && view.Name && (
                <ItemsRow
                    title={t('recently_added', {
                        category: view.Name,
                    })}
                    items={{
                        libraryId: view.Id,
                        sortBy: ['DateCreated'],
                        sortOrder: 'Descending',
                        limit: section.limit || 10,
                        types: getRecentlyAddedItemTypes(view.CollectionType),
                    }}
                    allLink={`/library?library=${view.Id}&page=0&sortBy=DateCreated&sortOrder=Descending`}
                    detailFields={detailFields}
                />
            )}
        </div>
    );
};

export default RecentlyAddedRow;
