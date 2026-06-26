import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import Page from '../Page';
import ItemsGridPage from '@/components/ItemsGridPage';
import { useItemsGridState } from '@/hooks/useItemsGridState';
import { useSectionItems } from '@/hooks/api/useSectionItems';
import { parseSectionItemsLink } from '@/utils/sectionItemsLink';

const ItemsSectionPage = () => {
    const { t } = useTranslation('home');
    const [searchParams] = useSearchParams();
    const { title, config } = parseSectionItemsLink(searchParams);
    const state = useItemsGridState({
        sortBy: config?.sortBy?.[0],
        sortOrder: config?.sortOrder,
    });
    const result = useSectionItems(config, state.params);

    return (
        <Page title={title} pagePadding>
            {config ? (
                <ItemsGridPage title={title} state={state} result={result} showFilters={false} />
            ) : (
                <p>{t('section_not_found')}</p>
            )}
        </Page>
    );
};

export default ItemsSectionPage;
