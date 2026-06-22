import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useStudioItems } from '../../hooks/api/useStudioItems';
import ItemsListPage from '../../components/ItemsListPage';

interface StudioPageProps {
    item: BaseItemDto;
}

const StudioPage = ({ item }: StudioPageProps) => (
    <ItemsListPage item={item} useItems={useStudioItems} />
);

export default StudioPage;
