import { useUserViews } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import LibraryCard from '../components/LibraryCard';
import { SUPPORTED_LIBRARY_COLLECTION_TYPES } from '../utils/supportedLibraryCollectionTypes';

const Library = () => {
    const { t } = useTranslation(['home', 'library']);
    const { data, isLoading } = useUserViews();

    const libraries = (data?.Items ?? []).filter(
        (library) =>
            library.CollectionType &&
            SUPPORTED_LIBRARY_COLLECTION_TYPES.includes(library.CollectionType)
    );

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">{t('home:libraries')}</h1>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                          <div
                              key={i}
                              className="aspect-video w-full animate-pulse rounded-md bg-muted"
                          />
                      ))
                    : libraries.map((library) => (
                          <LibraryCard key={library.Id} item={library} className="w-full" />
                      ))}
            </div>
            {!isLoading && libraries.length === 0 && (
                <p className="text-muted-foreground">{t('library:no_libraries_found')}</p>
            )}
        </div>
    );
};

export default Library;
