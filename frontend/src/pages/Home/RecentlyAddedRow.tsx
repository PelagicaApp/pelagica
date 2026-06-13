import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { COLLECTION_ITEM_TYPES, SUPPORTED_LIBRARY_COLLECTION_TYPES } from '../../utils/itemTypes';
import ItemsRow from './ItemsRow';
import { useTranslation } from 'react-i18next';
import type { DetailField, RecentlyAddedSection } from '../../hooks/api/useConfig';

interface RecentlyAddedRowProps {
    view: BaseItemDto;
    section: RecentlyAddedSection;
    detailFields?: DetailField[];
}

const RecentlyAddedRow = ({ view, section, detailFields }: RecentlyAddedRowProps) => {
    const { t } = useTranslation('home');

    if (!view.CollectionType || !SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(view.CollectionType)) {
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
                        types: COLLECTION_ITEM_TYPES[view.CollectionType],
                    }}
                    allLink={`/library?library=${view.Id}&page=0&sortBy=DateCreated&sortOrder=Descending`}
                    detailFields={detailFields}
                />
            )}
        </div>
    );
};

export default RecentlyAddedRow;
