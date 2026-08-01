import { createContext, useContext } from 'react';
import type { SeerrMediaType } from '@/api/seerr/types';

export interface SeerrDialogItem {
    id: number;
    mediaType: SeerrMediaType;
}

interface SeerrItemDialogContextType {
    openDialog: (item: SeerrDialogItem) => void;
}

export const SeerrItemDialogContext = createContext<SeerrItemDialogContextType | undefined>(
    undefined
);

export const useSeerrItemDialog = () => {
    const context = useContext(SeerrItemDialogContext);
    if (!context) throw new Error('useSeerrItemDialog must be used within SeerrItemDialogProvider');
    return context;
};
