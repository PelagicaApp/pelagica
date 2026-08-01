import SectionScroller from '@/components/SectionScroller';
import StudioCard from '@/components/StudioCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { useStudiosByItemCount } from '../../hooks/api/useStudiosApi';

interface StudiosRowProps {
    title?: string;
    limit?: number;
}

const CARD_CLASS = 'w-min min-w-48 lg:min-w-64 2xl:min-w-80';

const StudiosRow = ({ title, limit }: StudiosRowProps) => {
    const { data, isLoading } = useStudiosByItemCount({ limit });
    const studios = data?.items;

    if ((!studios || studios.length === 0) && !isLoading) {
        return null;
    }

    return (
        <SectionScroller
            className="max-w-full"
            title={
                <Link
                    to="/studios"
                    className="flex items-center gap-1 group cursor-pointer w-fit transition-colors"
                >
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <ChevronRight className="w-7 h-7 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
            }
            items={
                studios
                    ? studios.map((studio) => (
                          <StudioCard studio={studio} key={studio.id} className={CARD_CLASS} />
                      ))
                    : Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className={CARD_CLASS}>
                              <Skeleton className="w-full aspect-video rounded-md" />
                          </div>
                      ))
            }
            contentInset={true}
        />
    );
};

export default StudiosRow;
