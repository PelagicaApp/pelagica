'use client';

import { Disc3, Film, ListMusic, Mic2, Tags, Tv } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, TabsListUnderline, TabsTriggerUnderline } from '@/components/ui/tabs';
import type { BrowserMediaCategory } from '@/utils/sidebarLibraryNavigation';
import {
    getBrowseFiltersForCategory,
    normalizeBrowseFilter,
    type SidebarBrowseFilter,
} from '@/utils/sidebarBrowseFilters';

type SidebarBrowseFilterTabsProps = {
    category: BrowserMediaCategory;
    value: SidebarBrowseFilter;
    onValueChange: (filter: SidebarBrowseFilter) => void;
};

function getFilterIcon(category: BrowserMediaCategory, filter: SidebarBrowseFilter): LucideIcon {
    switch (filter) {
        case 'albums':
            return Disc3;
        case 'artists':
            return Mic2;
        case 'playlists':
            return ListMusic;
        case 'genres':
            return Tags;
        case 'all':
            return category === 'series' ? Tv : Film;
    }
}

export function SidebarBrowseFilterTabs({
    category,
    value,
    onValueChange,
}: SidebarBrowseFilterTabsProps) {
    const filters = getBrowseFiltersForCategory(category);
    const activeValue = normalizeBrowseFilter(category, value);
    const gridCols = category === 'music' ? 'grid-cols-4' : 'grid-cols-2';

    return (
        <Tabs
            value={activeValue}
            onValueChange={(next) => onValueChange(normalizeBrowseFilter(category, next))}
            className="shrink-0 gap-0"
        >
            <TabsListUnderline className={`grid ${gridCols}`}>
                {filters.map((filter) => {
                    const Icon = getFilterIcon(category, filter.value);

                    return (
                        <TabsTriggerUnderline
                            key={filter.value}
                            value={filter.value}
                            className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-1"
                        >
                            <Icon className="shrink-0" />
                            <span className="truncate">{filter.label}</span>
                        </TabsTriggerUnderline>
                    );
                })}
            </TabsListUnderline>
        </Tabs>
    );
}
