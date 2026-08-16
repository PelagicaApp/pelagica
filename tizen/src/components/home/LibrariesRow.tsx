import { useUserViews } from '@pelagica/core';
import LibraryCard from '../LibraryCard';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '../../utils/supportedLibraryCollectionTypes';
import ScrollableHomeSection from './ScrollableHomeSection';
import { Skeleton } from '../ui/skeleton';

const LibrariesRow = ({ title }: { title: string }) => {
    const { data, isLoading } = useUserViews();

    const libraries = (data?.Items ?? []).filter(
        (library) =>
            library.CollectionType &&
            SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(library.CollectionType)
    );

    if (!isLoading && libraries.length === 0) return null;

    return (
        <ScrollableHomeSection title={title} focusable={!isLoading}>
            {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex flex-col">
                          <Skeleton className="aspect-video w-60" />
                          <Skeleton className="mt-2 h-4 w-32" />
                      </div>
                  ))
                : libraries.map((library) => <LibraryCard key={library.Id} item={library} />)}
        </ScrollableHomeSection>
    );
};

export default LibrariesRow;
