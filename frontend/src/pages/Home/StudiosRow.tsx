import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { getStudioGithubThumbUrl, getStudioImageUrl, getThumbUrl } from '@/utils/jellyfinUrls';
import { ImageOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useStudiosBackendAvailable, useStudiosByItemCount } from '../../hooks/api/useStudiosApi';

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
    const { data: backendAvailable, isLoading: checkingBackend } = useStudiosBackendAvailable();

    const sources = useMemo(() => {
        const urls: string[] = [];
        if (backendAvailable) urls.push(getStudioImageUrl(item.name));
        urls.push(getStudioGithubThumbUrl(item.name));
        urls.push(getThumbUrl(item.id, { maxHeight: 300 }, undefined, 90));
        return urls;
    }, [backendAvailable, item.name, item.id]);

    const [sourceIndex, setSourceIndex] = useState(0);
    const src = sourceIndex < sources.length ? sources[sourceIndex] : undefined;

    return (
        <Link
            to={`/item/${item.id}`}
            key={item.id}
            className={'group w-min min-w-48 lg:min-w-64 2xl:min-w-80'}
        >
            <div className="relative w-full aspect-video rounded-md overflow-hidden">
                {checkingBackend ? (
                    <Skeleton className="w-full h-full rounded-md" />
                ) : !src ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                        <ImageOff className="w-12 h-12 text-muted-foreground" />
                    </div>
                ) : (
                    <img
                        src={src}
                        alt={item.name || 'No Name'}
                        className="w-full h-full object-cover rounded-md group-hover:opacity-75 transition-all group-hover:scale-105"
                        onError={() => setSourceIndex((i) => i + 1)}
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
