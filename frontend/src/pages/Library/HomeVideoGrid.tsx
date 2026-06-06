import { useRef, useEffect, useState, useMemo } from 'react';
import type { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { Link, useNavigate } from 'react-router';
import { Eye, ImageOff, Play } from 'lucide-react';
import { getPrimaryImageUrl } from '@/utils/jellyfinUrls';
import { useConfig } from '@/hooks/api/useConfig';
import WatchedStateBadge from '@/components/WatchedStateBadge';
import { useTranslation } from 'react-i18next';

const GAP = 8;
export const TARGET_ROW_HEIGHT = 240;

type Row = { items: BaseItemDto[]; height: number };

function getAspectRatio(item: BaseItemDto): number {
    return item.PrimaryImageAspectRatio ?? (item.Type === 'Photo' ? 1 : 16 / 9);
}

function buildRows(items: BaseItemDto[], containerWidth: number): Row[] {
    const rows: Row[] = [];
    let current: BaseItemDto[] = [];

    for (const item of items) {
        current.push(item);
        const totalAr = current.reduce((s, i) => s + getAspectRatio(i), 0);
        const h = (containerWidth - GAP * (current.length - 1)) / totalAr;
        if (h <= TARGET_ROW_HEIGHT) {
            rows.push({ items: current, height: h });
            current = [];
        }
    }

    if (current.length > 0) {
        const totalAr = current.reduce((s, i) => s + getAspectRatio(i), 0);
        const h = Math.min(
            (containerWidth - GAP * (current.length - 1)) / totalAr,
            TARGET_ROW_HEIGHT
        );
        rows.push({ items: current, height: h });
    }

    return rows;
}

const PlayIcon = ({ itemKind }: { itemKind?: BaseItemKind }) => {
    switch (itemKind) {
        case 'Photo':
            return <Eye className="w-5 h-5 text-white" />;
        default:
            return <Play className="w-5 h-5 text-white fill-white" />;
    }
}

const HomeVideoItem = ({ item, height }: { item: BaseItemDto; height: number }) => {
    const { config } = useConfig();
    const navigate = useNavigate();
    const { t } = useTranslation('library');
    const [imageError, setImageError] = useState(false);

    const ar = getAspectRatio(item);
    const width = Math.round(height * ar);

    const watched = item.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = item.RunTimeTicks ?? 0;
    const progress =
        item.UserData?.Played && watched <= 0
            ? 100
            : runtime > 0
              ? (watched / runtime) * 100
              : 0;

    const posterUrl = getPrimaryImageUrl(
        item.Id!,
        { width: Math.round(width * 2), height: Math.round(height * 2) }, // 2x for retina
        item.ImageTags?.Primary
    );

    const playLink = item.Type === 'Photo' ? `/photo/${item.Id}` : `/play/${item.Id}`;

    return (
        <Link
            to={playLink}
            style={{ width, height, flexShrink: 0 }}
            className="relative overflow-hidden rounded-md group"
        >
            {imageError ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-muted-foreground" />
                </div>
            ) : (
                <>
                    <img
                        src={posterUrl}
                        alt={item.Name || t('no_title')}
                        className="w-full h-full object-cover group-hover:opacity-75 group-hover:scale-105 transition-all"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <div
                            className="bg-black/60 rounded-full p-3 cursor-pointer hover:bg-black/75"
                            role="button"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(playLink);
                            }}
                        >
                            <PlayIcon itemKind={item.Type} />
                        </div>
                    </div>
                </>
            )}
            <WatchedStateBadge item={item} show={config?.watchedStateBadgeLibrary || false} />
            {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                    <div
                        style={{ width: `${progress}%` }}
                        className="h-full bg-brand transition-[width]"
                    />
                </div>
            )}
        </Link>
    );
};

const HomeVideoGrid = ({ items }: { items: BaseItemDto[] }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const rows = useMemo(
        () => (containerWidth > 0 ? buildRows(items, containerWidth) : []),
        [items, containerWidth]
    );

    return (
        <div ref={containerRef} className="w-full flex flex-col mt-2" style={{ gap: GAP }}>
            {rows.map((row, i) => (
                <div key={i} className="flex" style={{ gap: GAP, height: row.height }}>
                    {row.items.map((item) => (
                        <HomeVideoItem key={item.Id} item={item} height={row.height} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default HomeVideoGrid;