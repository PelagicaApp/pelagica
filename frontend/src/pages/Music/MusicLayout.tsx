import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import Page from '../Page';
import MusicLeftSidebar from './MusicLeftSidebar';
import MusicQueueSidebar from './MusicQueueSidebar';

const MusicLayout = () => {
    const { t } = useTranslation('music');
    return (
        <Page title={t('title')} requiresAuth pagePadding={false} showPlayerBar>
            <div className="flex h-[calc(100dvh-4.5rem)] px-4 sm:px-12 py-4 gap-0">
                <div className="border-r border-border pr-4">
                    <MusicLeftSidebar />
                </div>
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full px-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <Outlet />
                </div>
                <div className="border-l border-border pl-4">
                    <MusicQueueSidebar />
                </div>
            </div>
        </Page>
    );
};

export default MusicLayout;
