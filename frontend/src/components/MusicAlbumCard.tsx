import { useState } from 'react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getPrimaryImageUrl, type ImageSize } from '@/utils/jellyfinUrls';
import { getItemUrl } from '@/utils/itemUrl';
import { renderItemFallbackIcon } from '@/utils/itemFallbackIcon';
import { getAlbumArtistName } from '@/utils/musicPlaybackTrack';
import MusicItemContextMenu from '@/components/MusicItemContextMenu';
import { cn } from '@/lib/utils';

interface MusicAlbumCardProps {
    album: BaseItemDto;
    className?: string;
    posterClassName?: string;
    imageClassName?: string;
    imageSize?: ImageSize;
    imageQuality?: number;
    titleClassName?: string;
    subtitleClassName?: string;
    showPosterOutline?: boolean;
    showSkeleton?: boolean;
}

const MusicAlbumCard = ({
    album,
    className,
    posterClassName = 'relative aspect-square overflow-hidden rounded-md',
    imageClassName = 'w-full h-full object-cover group-hover:opacity-75 group-hover:scale-105 transition-all transform-gpu',
    imageSize = { width: 200, height: 200 },
    imageQuality,
    titleClassName = 'text-sm mt-2 truncate',
    subtitleClassName = 'text-xs text-muted-foreground truncate',
    showPosterOutline = false,
    showSkeleton = false,
}: MusicAlbumCardProps) => {
    const [imageError, setImageError] = useState(false);
    const artist = getAlbumArtistName(album);

    const posterUrl = getPrimaryImageUrl(
        album.Id || '',
        imageSize,
        album.ImageTags?.Primary,
        imageQuality
    );

    return (
        <MusicItemContextMenu item={album}>
            <Link
                to={getItemUrl(album.Type, album.Id)}
                className={cn('group flex flex-col p-0 m-0', className)}
            >
                <div className={cn(posterClassName, 'group')}>
                    {!imageError ? (
                        <>
                            <img
                                src={posterUrl}
                                alt={album.Name || ''}
                                className={cn(imageClassName, 'rounded-md z-10')}
                                loading="lazy"
                                onError={() => setImageError(true)}
                            />
                            {showSkeleton && (
                                <Skeleton className="absolute bottom-0 left-0 right-0 top-0 -z-1" />
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                            {renderItemFallbackIcon(album.Type, {
                                className: 'w-1/2 h-1/2 text-muted-foreground',
                                strokeWidth: 1.5,
                            })}
                        </div>
                    )}
                    {showPosterOutline && (
                        <div className="absolute inset-0 rounded-md pointer-events-none poster-card-outline z-20" />
                    )}
                </div>
                <span className={titleClassName}>{album.Name || ''}</span>
                {artist && <span className={subtitleClassName}>{artist}</span>}
            </Link>
        </MusicItemContextMenu>
    );
};

export default MusicAlbumCard;
