import { memo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import {
    getSeerrItemPosterUrl,
    useSeerrItemDetails,
    type SeerrSearchResultItem,
} from '@pelagica/core';
import { cn } from '@/lib/utils';
import { FOCUS_RING_LARGE } from '@/lib/focus-styles';
import FocusableCard from './FocusableCard';
import SeerrStatusBadge from './SeerrStatusBadge';
import { getSeerrHomeItemPath } from '@/lib/seerrItemPath';

const SeerrPosterCard = memo(function SeerrPosterCard({
    item,
}: {
    item: SeerrSearchResultItem;
}) {
    const [imageError, setImageError] = useState(false);
    const { data: details } = useSeerrItemDetails(
        item.mediaType,
        item.id,
        !item.posterPath
    );
    const posterPath = item.posterPath || details?.posterPath;
    const year = item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : undefined;

    return (
        <FocusableCard to={getSeerrHomeItemPath(item)} className="w-40">
            {(focused) => (
                <>
                    <div
                        className={cn(
                            'relative aspect-2/3 w-full overflow-hidden rounded-md border border-border bg-muted',
                            focused && FOCUS_RING_LARGE
                        )}
                    >
                        {imageError || !posterPath ? (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : (
                            <img
                                src={getSeerrItemPosterUrl(posterPath)}
                                alt={item.title}
                                className="h-full w-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        )}
                        <SeerrStatusBadge
                            mediaInfo={item.mediaInfo}
                            className="absolute top-1.5 left-1.5"
                        />
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{item.title}</p>
                    {year && <p className="text-xs text-muted-foreground">{year}</p>}
                </>
            )}
        </FocusableCard>
    );
});

export default SeerrPosterCard;
