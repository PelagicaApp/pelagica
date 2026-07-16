import type { ReactNode } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import MusicItemContextMenu from './MusicItemContextMenu';
import GeneralItemContextMenu from './GeneraItemContextMenu';
import { getMusicContextKind } from '@/utils/musicPlaybackTrack';

interface ItemContextMenuProps {
    item: BaseItemDto;
    children: ReactNode;
    playLink?: string;
}

const ItemContextMenu = ({ item, children, playLink }: ItemContextMenuProps) => {
    if (getMusicContextKind(item.Type)) {
        return <MusicItemContextMenu item={item}>{children}</MusicItemContextMenu>;
    }

    return (
        <GeneralItemContextMenu item={item} playLink={playLink}>
            {children}
        </GeneralItemContextMenu>
    );
};

export default ItemContextMenu;
