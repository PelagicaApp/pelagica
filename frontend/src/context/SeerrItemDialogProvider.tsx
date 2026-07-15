import { useState, type ReactNode } from 'react';
import { SeerrItemDialogContext, type SeerrDialogItem } from './SeerrItemDialogContext';
import SeerrItemDialog from '../components/SeerrItemDialog';

export const SeerrItemDialogProvider = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<SeerrDialogItem | null>(null);

    const openDialog = (item: SeerrDialogItem) => {
        setActiveItem(item);
        setOpen(true);
    };

    return (
        <SeerrItemDialogContext.Provider value={{ openDialog }}>
            {children}
            <SeerrItemDialog item={activeItem} open={open} onOpenChange={setOpen} />
        </SeerrItemDialogContext.Provider>
    );
};
