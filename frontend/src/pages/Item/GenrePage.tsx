import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useGenreItems } from '@pelagica/core';
import { useConfig } from '@pelagica/core';
import WatchedStateBadge from '@/components/WatchedStateBadge';
import ItemsListPage from '../../components/ItemsListPage';

interface GenrePageProps {
    item: BaseItemDto;
}

const GenrePage = ({ item }: GenrePageProps) => {
    const { config } = useConfig();

    return (
        <ItemsListPage
            item={item}
            useItems={useGenreItems}
            renderItemOverlay={(child) => (
                <WatchedStateBadge item={child} show={config?.watchedStateBadgeGenre || false} />
            )}
        />
    );
};

export default GenrePage;
