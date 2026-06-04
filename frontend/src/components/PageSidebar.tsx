import { SidebarBrowser } from '@/components/SidebarBrowser';

type PageSidebarProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const SIDEBAR_WIDTH = 'min(28rem, calc(100vw - 6rem))';

const PageSidebar = ({ open, onOpenChange }: PageSidebarProps) => (
    <aside
        aria-hidden={!open}
        className="hidden min-h-0 shrink-0 overflow-hidden border-r border-border bg-background/95 transition-[width] duration-300 ease-out md:block"
        style={{ width: open ? SIDEBAR_WIDTH : 0 }}
    >
        <div className="flex h-full w-[min(28rem,calc(100vw-6rem))] min-w-0 flex-col pt-14">
            <SidebarBrowser className="min-h-0 flex-1 p-3" onClose={() => onOpenChange(false)} />
        </div>
    </aside>
);

export default PageSidebar;