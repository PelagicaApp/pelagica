import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import {
    useRowItems,
    type ContinueWatchingDetailLine,
    type ContinueWatchingTitleLine,
} from '@pelagica/core';
import SectionScroller from '../../components/SectionScroller';
import EpisodeCard from './EpisodeCard';
import { Skeleton } from '../../components/ui/skeleton';

interface RecentEpisodesRowProps {
    title: string;
    limit?: number;
    view?: BaseItemDto;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
}

export const RecentEpisodesRow = ({
    title,
    limit,
    view,
    titleLine,
    detailLine,
}: RecentEpisodesRowProps) => {
    const {
        data: items,
        isLoading,
        error,
    } = useRowItems(
        {
            libraryId: view?.Id,
            sortBy: ['DateCreated'],
            sortOrder: 'Descending',
            limit: limit || 10,
            types: ['Episode'],
        },
        view?.Id !== undefined
    );

    if (!view || view.CollectionType !== 'tvshows') return null;

    return (
        <>
            {error && <p>Error loading next up items: {String(error)}</p>}
            <SectionScroller
                title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
                items={
                    isLoading || !items
                        ? Array.from({ length: 5 }).map((_, index) => (
                              <div key={index} className="group min-w-48 lg:min-w-64 2xl:min-w-80">
                                  <Skeleton className="w-full aspect-video rounded-md mb-2" />
                                  <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-2" />
                                  <Skeleton className="w-40 lg:w-52 2xl:w-64 h-3" />
                              </div>
                          ))
                        : items.map((item) => (
                              <EpisodeCard
                                  key={item.Id}
                                  item={item}
                                  titleLine={titleLine}
                                  detailLine={detailLine}
                              />
                          ))
                }
                contentInset={true}
            />
        </>
    );
};

export default RecentEpisodesRow;
