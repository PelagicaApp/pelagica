import { useRef, useState, type ReactNode, type RefObject } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { AdminItemDialogsContext, type AdminItemDialog } from './AdminItemDialogsContext';
import ManageImageButton from '../components/ManageImageButton';
import RefreshItemMetadataButton from '../components/RefreshItemMetadataButton';
import EditItemMetadataButton from '../components/EditItemMetadataButton';
import MediaDeleteButton from '../components/MediaDeleteButton';

const EMPTY_ITEM: BaseItemDto = {};

export const AdminItemDialogsProvider = ({ children }: { children: ReactNode }) => {
    const [activeItem, setActiveItem] = useState<BaseItemDto>(EMPTY_ITEM);

    const manageImagesTriggerRef = useRef<HTMLButtonElement>(null);
    const refreshMetadataTriggerRef = useRef<HTMLButtonElement>(null);
    const editMetadataTriggerRef = useRef<HTMLButtonElement>(null);
    const deleteTriggerRef = useRef<HTMLButtonElement>(null);

    const triggerRefs: Record<AdminItemDialog, RefObject<HTMLButtonElement | null>> = {
        manageImages: manageImagesTriggerRef,
        refreshMetadata: refreshMetadataTriggerRef,
        editMetadata: editMetadataTriggerRef,
        delete: deleteTriggerRef,
    };

    const openDialog = (item: BaseItemDto, dialog: AdminItemDialog) => {
        setActiveItem(item);
        setTimeout(() => triggerRefs[dialog].current?.click(), 0);
    };

    return (
        <AdminItemDialogsContext.Provider value={{ openDialog }}>
            {children}
            <div style={{ display: 'none' }}>
                <ManageImageButton
                    item={activeItem}
                    trigger={<button ref={manageImagesTriggerRef} />}
                />
                <RefreshItemMetadataButton
                    item={activeItem}
                    trigger={<button ref={refreshMetadataTriggerRef} />}
                />
                <EditItemMetadataButton
                    item={activeItem}
                    trigger={<button ref={editMetadataTriggerRef} />}
                />
                <MediaDeleteButton item={activeItem} trigger={<button ref={deleteTriggerRef} />} />
            </div>
        </AdminItemDialogsContext.Provider>
    );
};
