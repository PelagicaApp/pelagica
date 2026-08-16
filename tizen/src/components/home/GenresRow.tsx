import { useGenresWithItems } from '@pelagica/core';
import ScrollableHomeSection from './ScrollableHomeSection';
import GenreCard from '../GenreCard';
import { Skeleton } from '../ui/skeleton';

interface GenresRowProps {
    title?: string;
    limit?: number;
}

const GenresRow = ({ title, limit }: GenresRowProps) => {
    const { data: genres, isLoading } = useGenresWithItems({ limit });

    if ((!genres || genres.length === 0) && !isLoading) {
        return null;
    }

    return (
        <ScrollableHomeSection title={title || 'Genres'} focusable={!!genres}>
            {genres
                ? genres
                      .sort((a, b) => (b.item?.totalItems || 0) - (a.item?.totalItems || 0))
                      .map((genre) => <GenreCard key={genre.id} genreWithItem={genre} />)
                : Array.from({ length: 12 }).map((_, i) => (
                      <div
                          key={i}
                          className="relative min-w-60 sm:min-w-75 aspect-video rounded-md"
                      >
                          <Skeleton className="w-full h-full rounded-md" />
                      </div>
                  ))}
        </ScrollableHomeSection>
    );
};

export default GenresRow;
