import GenreItem from '@/components/GenreItem';
import { Skeleton } from '@/components/ui/skeleton';
import { useGenresWithItems } from '@pelagica/core';
import { memo } from 'react';

const GenreSkeletonLoader = memo(() => (
    <div className="w-full gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="relative w-full aspect-2/3 rounded-md">
                <Skeleton className="w-full h-full rounded-md" />
            </div>
        ))}
    </div>
));

const GenresGrid = () => {
    const { data: genres, isLoading, error } = useGenresWithItems();

    return (
        <div className="mt-4 w-full">
            {isLoading && <GenreSkeletonLoader />}
            {error && <span>Error loading genres.</span>}
            {!isLoading && !error && genres && (
                <div className="w-full gap-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {genres.map((genre) => (
                        <GenreItem key={genre.id} genreWithItem={genre} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GenresGrid;
