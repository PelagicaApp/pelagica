import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import MusicAlbumCard from '@/components/MusicAlbumCard';

interface MusicGridProps {
    items: BaseItemDto[];
}

const MusicGrid = ({ items }: MusicGridProps) => (
    <div className="w-full gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
        {items.map((item) => (
            <MusicAlbumCard
                key={item.Id}
                album={item}
                imageSize={{ maxWidth: 300, maxHeight: 300 }}
                imageQuality={85}
                titleClassName="mt-2 text-sm line-clamp-1 text-ellipsis break-all"
                subtitleClassName="text-xs text-muted-foreground line-clamp-1"
                showPosterOutline
                showSkeleton
            />
        ))}
    </div>
);

export default MusicGrid;
