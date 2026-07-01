import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ticksToReadableMusicTime } from '@/utils/timeConversion';
import type { MusicPlaybackTrack } from '@/context/MusicPlaybackContext';
import MusicItemContextMenu from '@/components/MusicItemContextMenu';
import { cn } from '@/lib/utils';

export interface MusicAlbumTrackRowProps {
    track: BaseItemDto;
    index: number;
    contextTracks: MusicPlaybackTrack[];
    onPlay: () => void;
    trailing?: ReactNode;
    displayIndex?: number;
}

const MusicAlbumTrackRowTrigger = forwardRef<
    HTMLDivElement,
    Omit<MusicAlbumTrackRowProps, 'contextTracks' | 'index'> & ComponentPropsWithoutRef<'div'>
>(({ track, onPlay, trailing, displayIndex, className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'flex items-center p-2 px-8 hover:bg-accent/70 rounded-md group cursor-pointer',
            className
        )}
        onClick={onPlay}
        {...props}
    >
        {(displayIndex ?? track.IndexNumber) !== undefined && (
            <span className="text-sm text-muted-foreground mr-8 font-mono w-4">
                <span className="group-hover:hidden">{displayIndex ?? track.IndexNumber}</span>
                <span className="hidden group-hover:inline-block">▶︎</span>
            </span>
        )}
        <div className="flex flex-col min-w-0 flex-1">
            <span>{track.Name}</span>
            {track.ArtistItems && track.ArtistItems.length > 0 && (
                <span className="text-sm text-muted-foreground">
                    {track.ArtistItems.map((artist) => artist.Name).join(', ')}
                </span>
            )}
        </div>
        {track.RunTimeTicks !== undefined && track.RunTimeTicks !== null && (
            <span className="text-sm text-muted-foreground ml-auto shrink-0">
                {ticksToReadableMusicTime(track.RunTimeTicks)}
            </span>
        )}
        {trailing && (
            <div className="ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                {trailing}
            </div>
        )}
    </div>
));
MusicAlbumTrackRowTrigger.displayName = 'MusicAlbumTrackRowTrigger';

const MusicAlbumTrackRow = ({
    track,
    index,
    contextTracks,
    onPlay,
    trailing,
    displayIndex,
    className,
    ...props
}: MusicAlbumTrackRowProps & ComponentPropsWithoutRef<'div'>) => (
    <MusicItemContextMenu item={track} contextTracks={contextTracks} startIndex={index}>
        <MusicAlbumTrackRowTrigger
            track={track}
            onPlay={onPlay}
            trailing={trailing}
            displayIndex={displayIndex}
            className={className}
            {...props}
        />
    </MusicItemContextMenu>
);

export default MusicAlbumTrackRow;
