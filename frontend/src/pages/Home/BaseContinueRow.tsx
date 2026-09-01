import type { ContinueWatchingDetailLine, ContinueWatchingTitleLine } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import EpisodeCard from './EpisodeCard';

interface BaseContinueRowProps {
    title: string;
    titleLine?: ContinueWatchingTitleLine;
    detailLine?: ContinueWatchingDetailLine[];
    items: BaseItemDto[];
    isLoading: boolean;
    error: unknown;
}

export function BaseContinueRow({
    title,
    titleLine,
    detailLine,
    items,
    isLoading,
    error,
}: BaseContinueRowProps) {
    return (
        <>
            {error && <p>Error loading next up items: {String(error)}</p>}
            {((items && items.length > 0) || isLoading) && (
                <SectionScroller
                    title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
                    items={
                        isLoading || !items
                            ? Array.from({ length: 5 }).map((_, index) => (
                                  <div
                                      key={index}
                                      className="group min-w-48 lg:min-w-64 2xl:min-w-80"
                                  >
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
            )}
        </>
    );
}

export default BaseContinueRow;
