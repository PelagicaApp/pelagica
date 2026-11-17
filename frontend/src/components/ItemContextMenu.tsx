import type { ReactNode } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import MusicItemContextMenu from './MusicItemContextMenu';
import GeneralItemContextMenu from './GeneraItemContextMenu';
import { getMusicContextKind } from '@/utils/musicPlaybackTrack';
import { isMusicPlaylist } from '@/utils/itemUrl';

interface ItemContextMenuProps {
    item: BaseItemDto;
    children: ReactNode;
    playLink?: string;
}

const ItemContextMenu = ({ item, children, playLink }: ItemContextMenuProps) => {
    const isVideoPlaylist = item.Type === 'Playlist' && !isMusicPlaylist(item.MediaType);
    if (getMusicContextKind(item.Type) && !isVideoPlaylist) {
        return <MusicItemContextMenu item={item}>{children}</MusicItemContextMenu>;
    }

    return (
        <GeneralItemContextMenu item={item} playLink={playLink}>
            {children}
        </GeneralItemContextMenu>
    );
};

export default ItemContextMenu;
