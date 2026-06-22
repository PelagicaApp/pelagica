import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { getStudioImageUrl } from '@/utils/jellyfinUrls';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useStudiosByItemCount } from '../../hooks/api/useStudiosApi';

interface StudiosRowProps {
    title?: string;
    limit?: number;
}

const StudioDisplay = ({
    item,
}: {
    item: {
        id: string;
        name: string;
        count: number;
    };
}) => {
    const [imageError, setImageError] = useState(false);

    return (
        <Link
            to={`/item/${item.id}`}
            key={item.id}
            className={'group w-min min-w-48 lg:min-w-64 2xl:min-w-80'}
        >
            <div className="relative w-full aspect-video rounded-md overflow-hidden">
                {imageError ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="w-12 h-12 text-muted-foreground" />
                    </div>
                ) : (
                    <img
                        src={getStudioImageUrl(item.name)}
                        alt={item.name || 'No Name'}
                        className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                )}
                <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
            </div>
        </Link>
    );
};

const StudiosRow = ({ title, limit }: StudiosRowProps) => {
    const { data: studios, isLoading } = useStudiosByItemCount(limit);

    if ((!studios || studios.length === 0) && !isLoading) {
        return null;
    }

    return (
        <SectionScroller
            className="max-w-full"
            title={<h2 className="text-2xl font-bold flex items-center gap-2">{title}</h2>}
            items={
                studios
                    ? studios.map((studio) => <StudioDisplay item={studio} key={studio.id} />)
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

export default StudiosRow;
