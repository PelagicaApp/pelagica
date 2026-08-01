import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { type ReactNode } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from './ui/context-menu';
import { useAdminItemDialogs } from '../context/AdminItemDialogsContext';
import { useCurrentUser } from '../hooks/api/useCurrentUser';
import { useTranslation } from 'react-i18next';
import {
    Bookmark,
    Download,
    Heart,
    Image,
    PencilLine,
    Play,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useFavorite } from '../hooks/api/useFavorite';
import { useConfig } from '../hooks/api/useConfig';
import { Link } from 'react-router';
import { useLike } from '../hooks/api/useLike';
import { WATCHLISTABLE_ITEM_TYPES } from '../utils/watchlistableItems';
import { DOWNLOADABLE_ITEM_TYPES } from '../utils/downloadableItems';
import { getDownloadurl } from '../utils/jellyfinUrls';

interface GeneralItemContextMenuProps {
    item: BaseItemDto;
    playLink?: string;
    children: ReactNode;
}

const GeneralItemContextMenu = ({ item, playLink, children }: GeneralItemContextMenuProps) => {
    const { t } = useTranslation('item');
    const { config } = useConfig();
    const { data: currentUser } = useCurrentUser();
    const { openDialog } = useAdminItemDialogs();

    const { isFavorite, toggleFavorite, isLoading: isFavoriteLoading } = useFavorite(item.Id);
    const showFavoriteToggle = item.Type && config?.itemPage?.favoriteButton?.includes(item.Type);

    const { isLiked, toggleLike, isLoading } = useLike(item.Id);
    const showWatchlistToggle =
        item.Type &&
        WATCHLISTABLE_ITEM_TYPES.includes(item.Type) &&
        config?.itemPage?.showWatchlistButton;

    const showDownloadButton =
        item.Type &&
        DOWNLOADABLE_ITEM_TYPES.includes(item.Type) &&
        config?.itemPage?.showDownloadButton;

    const isAdmin = currentUser?.Policy?.IsAdministrator ?? false;
    const hasItemsAbove =
        Boolean(playLink) ||
        Boolean(showFavoriteToggle) ||
        Boolean(showWatchlistToggle) ||
        Boolean(showDownloadButton);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                {playLink && (
                    <ContextMenuItem asChild>
                        <Link to={playLink}>
                            <Play />
                            {t('play')}
                        </Link>
                    </ContextMenuItem>
                )}
                {showFavoriteToggle && (
                    <ContextMenuItem
                        onClick={() => toggleFavorite(!isFavorite)}
                        disabled={isFavoriteLoading}
                    >
                        <Heart fill={isFavorite ? 'currentColor' : 'none'} />
                        {isFavorite ? t('unfavorite') : t('favorite')}
                    </ContextMenuItem>
                )}
                {showWatchlistToggle && (
                    <ContextMenuItem onClick={() => toggleLike(!isLiked)} disabled={isLoading}>
                        <Bookmark fill={isLiked ? 'currentColor' : 'none'} />
                        {isLiked ? t('remove_from_watchlist') : t('add_to_watchlist')}
                    </ContextMenuItem>
                )}
                {showDownloadButton && (
                    <ContextMenuItem asChild>
                        <a
                            href={getDownloadurl(item.Id || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Download />
                            {t('download')}
                        </a>
                    </ContextMenuItem>
                )}
                {isAdmin && (
                    <>
                        {hasItemsAbove && <ContextMenuSeparator />}
                        <ContextMenuItem onClick={() => openDialog(item, 'manageImages')}>
                            <Image />
                            {t('manage_images')}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => openDialog(item, 'refreshMetadata')}>
                            <RotateCcw />
                            {t('refreshMetadata')}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => openDialog(item, 'editMetadata')}>
                            <PencilLine />
                            {t('editMetadata')}
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => openDialog(item, 'delete')}>
                            <Trash2 />
                            {t('deleteItem')}
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default GeneralItemContextMenu;
