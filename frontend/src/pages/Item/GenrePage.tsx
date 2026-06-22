import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useSearchParams } from 'react-router';
import { useGenreItemsScoped } from '@/hooks/api/genres/useGenreItems';
import { useConfig } from '@/hooks/api/useConfig';
import WatchedStateBadge from '@/components/WatchedStateBadge';
import { GENRE_MEDIA_PARAM, parseGenreMediaCategory } from '@/utils/sidebarBrowseFilters';
import { useSidebarBrowser } from '@/context/SidebarBrowserContext';
import ItemsListPage from '@/components/ItemsListPage';

interface GenrePageProps {
    item: BaseItemDto;
}

const GenrePage = ({ item }: GenrePageProps) => {
    const { config } = useConfig();
    const [searchParams] = useSearchParams();
    const { category: sidebarCategory } = useSidebarBrowser();
    const mediaCategory =
        parseGenreMediaCategory(searchParams.get(GENRE_MEDIA_PARAM)) ??
        (sidebarCategory === 'music' || sidebarCategory === 'series' || sidebarCategory === 'movie'
            ? sidebarCategory
            : null);
    const isMusic = item.Type === 'MusicGenre' || mediaCategory === 'music';

    return (
        <ItemsListPage
            item={item}
            useItems={useGenreItemsScoped}
            itemAspectClass={isMusic ? 'aspect-square' : 'aspect-2/3'}
            renderItemOverlay={(child) => (
                <WatchedStateBadge item={child} show={config?.watchedStateBadgeGenre || false} />
            )}
        />
    );
};

export default GenrePage;
