import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import ItemBadge from './ItemBadge';

const LIMIT = 4;

const ShowMoreButton = ({
    rowKey,
    total,
    expanded,
    onToggle,
    t,
}: {
    rowKey: string;
    total: number;
    expanded: Record<string, boolean>;
    onToggle: (key: string) => void;
    t: (key: string) => string;
}) =>
    total > LIMIT ? (
        <button
            onClick={() => onToggle(rowKey)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
            {expanded[rowKey] ? t('show_less') : `+${total - LIMIT} ${t('more')}`}
        </button>
    ) : null;

interface ItemMetadataBadgesProps {
    item: BaseItemDto;
}

const ItemMetadataBadges = ({ item }: ItemMetadataBadgesProps) => {
    const { t } = useTranslation('item');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

    const writers = item.People?.filter((p) => p.Type === 'Writer' && p.Name) ?? [];
    const directors = item.People?.filter((p) => p.Type === 'Director' && p.Name) ?? [];
    const genres = item.GenreItems?.filter((g) => g.Name) ?? [];
    const studios = item.Studios?.filter((s) => s.Name) ?? [];

    const visible = <T,>(key: string, arr: T[]) => (expanded[key] ? arr : arr.slice(0, LIMIT));

    const showMore = (rowKey: string, total: number) => (
        <ShowMoreButton rowKey={rowKey} total={total} expanded={expanded} onToggle={toggle} t={t} />
    );

    if (
        writers.length === 0 &&
        directors.length === 0 &&
        genres.length === 0 &&
        studios.length === 0
    ) {
        return null;
    }

    return (
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 border-t border-black/10 dark:border-white/10 pt-6 w-full max-w-4xl items-start">
            {genres.length > 0 && (
                <>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-0.5">
                        {t('genres')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {visible('genres', genres).map((genre) => (
                            <ItemBadge key={genre.Name} asChild>
                                <Link to={`/genre/${genre.Id}`}>{genre.Name}</Link>
                            </ItemBadge>
                        ))}
                        {showMore('genres', genres.length)}
                    </div>
                </>
            )}

            {directors.length > 0 && (
                <>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-0.5">
                        {t('directors')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {visible('directors', directors).map((person) => (
                            <ItemBadge key={person.Name} asChild>
                                <Link to={`/person/${person.Id}`}>{person.Name}</Link>
                            </ItemBadge>
                        ))}
                        {showMore('directors', directors.length)}
                    </div>
                </>
            )}

            {writers.length > 0 && (
                <>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-0.5">
                        {t('writers')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {visible('writers', writers).map((person) => (
                            <ItemBadge key={person.Name} asChild>
                                <Link to={`/person/${person.Id}`}>{person.Name}</Link>
                            </ItemBadge>
                        ))}
                        {showMore('writers', writers.length)}
                    </div>
                </>
            )}

            {studios.length > 0 && (
                <>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-0.5">
                        {t('studios')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {visible('studios', studios).map((studio) => (
                            <ItemBadge key={studio.Name} asChild>
                                {studio.Id ? (
                                    <Link
                                        to={`/item/${studio.Id}?name=${encodeURIComponent(studio.Name ?? '')}`}
                                    >
                                        {studio.Name}
                                    </Link>
                                ) : (
                                    <span>{studio.Name}</span>
                                )}
                            </ItemBadge>
                        ))}
                        {showMore('studios', studios.length)}
                    </div>
                </>
            )}
        </div>
    );
};

export default ItemMetadataBadges;
