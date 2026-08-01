import Page from '../Page';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid2x2, ListTree } from 'lucide-react';
import LiveTvGuide from './LiveTvGuide';
import LiveTvChannels from './LiveTvChannels';
import LiveTvChannelSearchBar from './LiveTvChannelSearchBar';
import { CATEGORY_FILTER_OPTIONS, type ChannelCategoryFilter } from './liveTvChannelFilters';

const LivetvPage = () => {
    const { t } = useTranslation(['live', 'common']);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ChannelCategoryFilter>('all');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const categoryOptions = CATEGORY_FILTER_OPTIONS[categoryFilter];

    return (
        <Page title={t('live:title')} requiresAuth className="flex-1">
            <Tabs defaultValue="channels">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <TabsList>
                        <TabsTrigger value="channels">
                            <Grid2x2 className="h-4 w-4" />
                            {t('live:tab_channels')}
                        </TabsTrigger>
                        <TabsTrigger value="guide">
                            <ListTree className="h-4 w-4" />
                            {t('live:tab_guide')}
                        </TabsTrigger>
                    </TabsList>
                    <LiveTvChannelSearchBar
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        categoryFilter={categoryFilter}
                        onCategoryFilterChange={setCategoryFilter}
                        className="w-full sm:w-auto sm:max-w-sm"
                    />
                </div>

                <TabsContent value="channels">
                    <LiveTvChannels
                        searchTerm={debouncedSearch}
                        categoryOptions={categoryOptions}
                    />
                </TabsContent>

                <TabsContent value="guide">
                    <LiveTvGuide searchTerm={debouncedSearch} categoryOptions={categoryOptions} />
                </TabsContent>
            </Tabs>
        </Page>
    );
};

export default LivetvPage;
