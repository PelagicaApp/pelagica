import { createContext, useContext } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

export type AdminItemDialog = 'manageImages' | 'refreshMetadata' | 'editMetadata' | 'delete';

interface AdminItemDialogsContextType {
    openDialog: (item: BaseItemDto, dialog: AdminItemDialog) => void;
}

export const AdminItemDialogsContext = createContext<AdminItemDialogsContextType | undefined>(
    undefined
);

export const useAdminItemDialogs = () => {
    const context = useContext(AdminItemDialogsContext);
    if (!context)
        throw new Error('useAdminItemDialogs must be used within AdminItemDialogsProvider');
    return context;
};
