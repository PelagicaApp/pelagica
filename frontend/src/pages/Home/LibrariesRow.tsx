import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserViews } from '@/hooks/api/useUserViews';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '@/utils/itemTypes';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

interface LibrariesRowProps {
    title?: string;
}

const LibraryDisplay = ({ item }: { item: BaseItemDto }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <Link
            to={`/library?library=${item.Id}`}
            key={item.Id}
            className={'group w-min min-w-48 lg:min-w-64 2xl:min-w-80'}
        >
            <div className="relative w-full aspect-video rounded-md overflow-hidden">
                {imageError ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="w-12 h-12 text-muted-foreground" />
                    </div>
                ) : (
                    <div className="relative">
                        <img
                            src={getPrimaryImageUrl(item.Id!, {
                                width: 416,
                            })}
                            alt={item.Name || 'No Name'}
                            className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                            onError={() => setImageError(true)}
                        />
                    </div>
                )}
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
            </div>
        </Link>
    );
};

const LibrariesRow = ({ title }: LibrariesRowProps) => {
    const { data: libraries, isLoading } = useUserViews();

    if ((!libraries || !libraries.Items || libraries.Items?.length === 0) && !isLoading) {
        return null;
    }

    return (
        <SectionScroller
            className="max-w-full"
            title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
            items={
                libraries
                    ? libraries
                          .Items!.filter((library) =>
                              SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(library.CollectionType!)
                          )
                          .map((library) => <LibraryDisplay item={library} key={library.Id} />)
                    : Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="w-min min-w-48 lg:min-w-64 2xl:min-w-80">
                              <Skeleton className="w-full aspect-video rounded-md" />
                          </div>
                      ))
            }
            contentInset={true}
        />
    );
};

export default LibrariesRow;
