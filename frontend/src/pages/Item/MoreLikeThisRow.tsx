import ScrollableSectionPoster from '@/components/ScrollableSectionPoster';
import SectionScroller from '@/components/SectionScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { useSimilarItems } from '@/hooks/api/useSimilarItems';
import { memo, useMemo } from 'react';
import type React from 'react';
import GeneralItemContextMenu from '../../components/GeneraItemContextMenu';

interface MoreLikeThisRowProps {
    title?: React.ReactNode;
    itemId: string;
    isLoading?: boolean;
    posterShape?: 'portrait' | 'square';
    itemType?: string;
}

const portraitSkeletonItems = Array.from({ length: 5 }, (_, index) => (
    <div key={index} className="w-36 lg:w-44 2xl:w-52">
        <Skeleton className="w-36 h-54 lg:w-44 lg:h-64 2xl:w-52 2xl:h-80 rounded-md mb-2" />
        <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-1" />
        <Skeleton className="w-20 lg:w-24 2xl:w-28 h-3" />
    </div>
));

const squareSkeletonItems = Array.from({ length: 5 }, (_, index) => (
    <div key={index} className="w-36 lg:w-44 2xl:w-52">
        <Skeleton className="w-36 h-36 lg:w-44 lg:h-44 2xl:w-52 2xl:h-52 rounded-md mb-2" />
        <Skeleton className="w-32 lg:w-40 2xl:w-48 h-4 mb-1" />
        <Skeleton className="w-20 lg:w-24 2xl:w-28 h-3" />
    </div>
));

const MoreLikeThisRow: React.FC<MoreLikeThisRowProps> = memo(
    ({ title, itemId, isLoading, posterShape = 'portrait', itemType }) => {
        const { data: similarItems, isLoading: isLoadingSimilarItems } = useSimilarItems(
            itemId,
            12
        );
        const skeletonItems =
            posterShape === 'square' ? squareSkeletonItems : portraitSkeletonItems;

        const displayItems = useMemo(() => {
            if (!similarItems) return [];
            if (itemType) {
                return similarItems.filter((item) => item.Type === itemType);
            }
            return similarItems;
        }, [similarItems, itemType]);

        const itemElements = useMemo(() => {
            return displayItems.map((item) => (
                <GeneralItemContextMenu key={item.Id} item={item}>
                    <ScrollableSectionPoster item={item}>
                        {item.PremiereDate && (
                            <span className="text-xs text-muted-foreground mt-1">
                                {new Date(item.PremiereDate).getFullYear()}
                            </span>
                        )}
                    </ScrollableSectionPoster>
                </GeneralItemContextMenu>
            ));
        }, [displayItems]);

        if (isLoading || isLoadingSimilarItems) {
            return <SectionScroller title={title} items={skeletonItems} />;
        }

        if (displayItems.length === 0) {
            return null;
        }

        return <SectionScroller title={title} items={itemElements} />;
    }
);

MoreLikeThisRow.displayName = 'MoreLikeThisRow';

export default MoreLikeThisRow;
