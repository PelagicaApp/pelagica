import { type CSSProperties } from 'react';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

type PageSidebarProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    style: CSSProperties;
};

const PageSidebar = ({ open, onOpenChange, style }: PageSidebarProps) => (
    <SidebarProvider
        className="box-border hidden h-full min-h-0 w-auto shrink-0 pt-14 md:flex"
        style={style}
        open={open}
        onOpenChange={onOpenChange}
    >
        <AppSidebar />
    </SidebarProvider>
);

export default PageSidebar;