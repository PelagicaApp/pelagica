import GenreItem from '@/components/GenreItem';
import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { useGenresWithItems } from '@/hooks/api/genres/useGenresWithItems';

interface GenresRowProps {
    title?: string;
    limit?: number;
    contentInset?: number;
}

const GenresRow = ({ title, limit, contentInset }: GenresRowProps) => {
    const { data: genres, isLoading } = useGenresWithItems({ limit });

    if ((!genres || genres.length === 0) && !isLoading) {
        return null;
    }

    return (
        <SectionScroller
            className="max-w-full"
            title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
            items={
                genres
                    ? genres
                          .sort((a, b) => (b.item?.totalItems || 0) - (a.item?.totalItems || 0))
                          .map((genre) => (
                              <GenreItem genreWithItem={genre} className="min-w-60 sm:min-w-75" />
                          ))
                    : Array.from({ length: 12 }).map((_, i) => (
                          <div
                              key={i}
                              className="relative min-w-60 sm:min-w-75 aspect-video rounded-md"
                          >
                              <Skeleton className="w-full h-full rounded-md" />
                          </div>
                      ))
            }
            contentInset={contentInset}
        />
    );
};

export default GenresRow;
