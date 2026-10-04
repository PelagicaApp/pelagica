import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Page from '../Page';
import ItemsGridPage from '@/components/ItemsGridPage';
import { useItemsGridState } from '@/hooks/useItemsGridState';
import { useSectionItems } from '@pelagica/core';
import { parseSectionItemsLink } from '@/utils/sectionItemsLink';
import { useTranslatedSectionTitle } from '@/utils/sectionTitle';

const ItemsSectionPage = () => {
    const { t } = useTranslation('home');
    const translateTitle = useTranslatedSectionTitle();
    const [searchParams] = useSearchParams();
    const { title, config } = parseSectionItemsLink(searchParams);
    const displayTitle = translateTitle(title);
    const state = useItemsGridState({
        sortBy: config?.sortBy?.[0],
        sortOrder: config?.sortOrder,
    });
    const result = useSectionItems(config, state.params);

    return (
        <Page title={displayTitle} pagePadding>
            {config ? (
                <ItemsGridPage
                    title={displayTitle}
                    state={state}
                    result={result}
                    showFilters={false}
                />
            ) : (
                <p>{t('section_not_found')}</p>
            )}
        </Page>
    );
};

export default ItemsSectionPage;
