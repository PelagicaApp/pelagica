import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { COLLECTION_ITEM_TYPES, type DetailField, type RecentlyAddedSection } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '../../utils/supportedLibraryCollectionTypes';
import ItemsRow from './ItemsRow';

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
        <>
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
                    detailFields={detailFields}
                />
            )}
        </>
    );
};

export default RecentlyAddedRow;
