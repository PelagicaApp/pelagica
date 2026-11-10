import { useState, useRef } from 'react';
import type { BaseItemDto, TrickplayInfoDto } from '@jellyfin/sdk/lib/generated-client';
import { getTrickplayImageUrl, formatPlayTime } from '@pelagica/core';

interface ProgressBarProps {
    item: BaseItemDto;
    progressPercentage: number; // Actual playing progress from player (0-100)
    bufferedPercentage: number;
    duration: number;
    onClick: (percentage: number) => void; // Triggered on click
    onSeek: (percentage: number) => void; // Trigerred on seek
}

function getPrimaryTrickplayInfo(trickplay?: BaseItemDto['Trickplay']) {
    if (!trickplay) return null;

    const entries = Object.values(trickplay);
    const first = entries[0];
    if (!first) return null;
    const subEntries = Object.values(first);
    return subEntries[0] || null;
}

function getTrickplayTile(time: number, trickplay: TrickplayInfoDto) {
    const interval = trickplay.Interval ?? 1;
    const tileWidth = trickplay.TileWidth ?? 1;
    const tileHeight = trickplay.TileHeight ?? 1;

    const timeMs = time * 1000;
    const thumbnailIndex = Math.floor(timeMs / interval);
    const tilesPerImage = tileWidth * tileHeight;

    const imageIndex = Math.floor(thumbnailIndex / tilesPerImage);
    const tileIndex = thumbnailIndex % tilesPerImage;

    const x = tileIndex % tileWidth;
    const y = Math.floor(tileIndex / tileWidth);

    return {
        thumbnailIndex,
        imageIndex,
        x,
        y,
        width: trickplay.Width,
        height: trickplay.Height,
    };
}

function ProgressBar({
    item,
    progressPercentage,
    bufferedPercentage,
    duration,
    onClick,
    onSeek,
}: ProgressBarProps) {
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState<number>(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubPercentage, setScrubPercentage] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        onClick(percentage * duration);
    };

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        setHoverTime(percentage * duration);
        setHoverPosition(x);
    };

    // Calculates 0-100 percentage based on pointer X position relative to track
    const getPercentageFromEvent = (clientX: number) => {
        if (!progressRef.current) return 0;
        const rect = progressRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const percentage = (offsetX / rect.width) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        // Locks mouse movements to this element so drag continues even off-track
        e.currentTarget.setPointerCapture(e.pointerId);
        
        setIsScrubbing(true);
        const newPercent = getPercentageFromEvent(e.clientX);
        setScrubPercentage(newPercent);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isScrubbing) return;
        const newPercent = getPercentageFromEvent(e.clientX);
        setScrubPercentage(newPercent);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isScrubbing) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        
        const finalPercent = getPercentageFromEvent(e.clientX);
        setIsScrubbing(false);
        
        // Commit the actual seek position to your player
        onSeek(finalPercent);
    };

    const handleProgressLeave = () => {
        setHoverTime(null);
    };

    const displayPercentage = isScrubbing ? scrubPercentage : progressPercentage;

    return (
        <div
            ref={progressRef}
            className="w-full h-3 rounded cursor-pointer mb-4 transition-all relative"
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Actually visible bar that's smaller for better asthetics */}
            <div className="absolute top-1 left-0 w-full h-1 bg-gray-600 rounded pointer-events-none z-0" />
            {/* buffered progress */}
             <div
                 className="absolute top-1 left-0 h-1 bg-gray-500 rounded pointer-events-none z-5"
                 style={{ width: `${bufferedPercentage}%` }}
             />
            {/* Bar that shows the hovered time */}
            <div
                className="absolute top-1 left-0 h-1 bg-white/20 rounded pointer-events-none z-10"
                style={{
                    width:
                        hoverTime !== null ? `${(hoverTime / duration) * 100}%` : '0%',
                }}
            />
            {/* current progress */}
            <div
                className={`absolute top-1 left-0 h-1 bg-brand rounded pointer-events-none z-15 ${isScrubbing ? 'transition-none' : 'transition-[width] duration-250 ease-linear'}`}
                style={{ width: `${displayPercentage}%` }}
            >
                {/* Scrubber Thumb (Circle Indicator) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-brand rounded-full shadow-md transition-transform duration-150 group-hover:scale-125" />
            </div>
            {/* Hopper Preview */}
            {hoverTime !== null &&
                item.Trickplay &&
                (() => {
                    const trickplayInfo = getPrimaryTrickplayInfo(item.Trickplay);
                    if (!trickplayInfo || hoverTime === null) return null;

                    const { imageIndex, x, y, width, height } = getTrickplayTile(
                        hoverTime,
                        trickplayInfo
                    );

                    const previewWidth = width || 320;
                    const halfWidth = previewWidth / 2;
                    const clampedPosition = Math.max(
                        halfWidth,
                        Math.min(hoverPosition, window.innerWidth - halfWidth)
                    );

                    return (
                        <div
                            className="absolute bottom-4 -translate-x-1/2 text-white pointer-events-none z-40 flex flex-col items-center"
                            style={{ left: `${clampedPosition}px` }}
                        >
                            <div
                                className="relative overflow-hidden rounded-md mb-1"
                                style={{
                                    width: width,
                                    height: height,
                                }}
                            >
                                <img
                                    src={getTrickplayImageUrl(
                                        item.Id!,
                                        width || 320,
                                        imageIndex
                                    )}
                                    style={{
                                        position: 'absolute',
                                        left: -x * (width || 0),
                                        top: -y * (height || 0),
                                        maxWidth: 'none',
                                    }}
                                    draggable={false}
                                />
                            </div>
                            <div className="text-center bg-black/90 p-1 px-2 rounded-md w-min">
                                {formatPlayTime(hoverTime)}
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
}

export {
    ProgressBar
}