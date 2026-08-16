import { useEffect, useMemo, useState, useTransition } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { useSearch, type SearchMode } from '@/context/SearchContext';
import { useSearchItems } from '@pelagica/core';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import { useNavigate } from 'react-router';
import { Skeleton } from './ui/skeleton';
import { Calendar, Clapperboard, Music, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import JellyfinItemKindIcon from './JellyfinItemKindIcon';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { getPrimaryImageUrl } from '@pelagica/core';
import { getItemUrl } from '@/utils/itemUrl';
import { cn } from '@/lib/utils';
import { renderItemFallbackIcon } from '@/utils/itemFallbackIcon';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const SEARCH_MODES: {
    mode: SearchMode;
    icon: typeof Clapperboard;
    shortcut: string;
}[] = [
    { mode: 'movies-tv', icon: Clapperboard, shortcut: isMac ? '⌘K' : 'Ctrl+K' },
    { mode: 'music', icon: Music, shortcut: isMac ? '⌘M' : 'Ctrl+M' },
];

const ItemDescription = ({ item }: { item: BaseItemDto }) => {
    const isMusicItem = item.Type === 'MusicAlbum' || item.Type === 'Audio';
    const isMusicArtist = item.Type === 'MusicArtist';

    return (
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {isMusicItem && (
                <>
                    {item.Artists && item.Artists.length > 0 && (
                        <span className="line-clamp-1">{item.Artists.join(', ')}</span>
                    )}
                    {item.ProductionYear && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3! w-3!" />
                            <span>{item.ProductionYear}</span>
                        </div>
                    )}
                </>
            )}
            {!isMusicItem && !isMusicArtist && (
                <>
                    {item.ProductionYear && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3! w-3!" />
                            <span>{item.ProductionYear}</span>
                        </div>
                    )}
                    {item.CommunityRating && (
                        <div className="flex items-center gap-1">
                            <Star className="h-3! w-3!" />
                            <span>{item.CommunityRating.toFixed(1)}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const SearchResultImage = ({
    src,
    alt,
    type,
    className,
}: {
    src: string;
    alt: string;
    type?: string;
    className: string;
}) => {
    const [imageError, setImageError] = useState(false);

    if (imageError || !src) {
        return (
            <div className={cn(className, 'bg-muted flex items-center justify-center rounded-md')}>
                {renderItemFallbackIcon(type, {
                    className: 'w-1/2 h-1/2 text-muted-foreground',
                    strokeWidth: 1.5,
                })}
            </div>
        );
    }

    return (
        <>
            <img
                src={src}
                alt={alt}
                className={cn(className, 'object-cover rounded-md')}
                loading="lazy"
                onError={() => setImageError(true)}
            />
            <Skeleton className="absolute bottom-0 left-0 right-0 top-0 -z-1" />
        </>
    );
};

export const SearchCommand = () => {
    const { t } = useTranslation('search');
    const { isOpen, searchMode, setSearchMode, closeSearch } = useSearch();
    const navigate = useNavigate();
    const { loadTrack } = useMusicPlayback();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [, startTransition] = useTransition();
    const itemTypes: BaseItemKind[] =
        searchMode === 'music' ? ['MusicAlbum', 'Audio', 'MusicArtist'] : ['Movie', 'Series'];
    const {
        data: results,
        isLoading,
        error,
    } = useSearchItems(debouncedQuery, {
        itemTypes,
        limit: 15,
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            startTransition(() => {
                setDebouncedQuery(query);
            });
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    useEffect(() => {
        if (!isOpen) {
            startTransition(() => {
                setQuery('');
            });
        }
    }, [isOpen]);

    const posterUrls = useMemo(() => {
        if (!results) return {};
        try {
            return results.reduce(
                (acc, item) => {
                    acc[item.Id!] =
                        getPrimaryImageUrl(item.Id!, {
                            maxWidth: 96,
                            maxHeight: 144,
                        }) || '';
                    return acc;
                },
                {} as Record<string, string>
            );
        } catch {
            // if not authenticated return empty object
            return {};
        }
    }, [results]);

    return (
        <CommandDialog
            open={isOpen}
            onOpenChange={closeSearch}
            title={t('title')}
            description={t('description')}
            shouldFilter={false}
        >
            <CommandInput
                placeholder={
                    searchMode === 'music'
                        ? t('input_placeholder_music')
                        : t('input_placeholder_movies_tv')
                }
                value={query}
                onValueChange={setQuery}
            />
            <div className="flex gap-1 border-b px-2 py-1.5">
                {SEARCH_MODES.map(({ mode, icon: Icon, shortcut }) => (
                    <Button
                        key={mode}
                        type="button"
                        variant={searchMode === mode ? 'secondary' : 'ghost'}
                        size="sm"
                        aria-pressed={searchMode === mode}
                        className={cn(
                            'h-8 flex-1 justify-between px-2.5',
                            searchMode !== mode && 'text-muted-foreground'
                        )}
                        onClick={() => setSearchMode(mode)}
                    >
                        <span className="flex items-center gap-1.5">
                            <Icon className="size-3.5" />
                            <span className="text-xs">{t('typefilter_' + mode)}</span>
                        </span>
                        <kbd className="pointer-events-none hidden h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                            {shortcut}
                        </kbd>
                    </Button>
                ))}
            </div>
            <CommandList className="[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground [&::-webkit-scrollbar-thumb]:rounded-full">
                {error ? (
                    <div className="px-4 py-8 text-center text-sm text-destructive">
                        Error: {error.message || t('failed_search')}
                    </div>
                ) : !query ? (
                    <CommandEmpty>{t('start_typing')}</CommandEmpty>
                ) : isLoading ? (
                    <>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-md">
                                <Skeleton className="w-12 h-18 rounded-md shrink-0" />
                                <div className="flex flex-col justify-start min-w-0 flex-1 gap-2">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                </div>
                            </div>
                        ))}
                    </>
                ) : results && results.length > 0 ? (
                    <>
                        {results.map((item) => {
                            const posterClass =
                                item.Type === 'MusicAlbum' ||
                                item.Type === 'Audio' ||
                                item.Type === 'Person' ||
                                item.Type === 'MusicArtist'
                                    ? 'w-13 h-13'
                                    : 'w-13 h-20';

                            return (
                                <CommandItem
                                    key={item.Id}
                                    value={item.Id}
                                    onSelect={() => {
                                        if (item.Type === 'Audio') {
                                            loadTrack(
                                                {
                                                    id: item.Id || '',
                                                    title: item.Name || '',
                                                    artist:
                                                        item.ArtistItems?.[0]?.Name ||
                                                        item.Artists?.[0] ||
                                                        'Unknown',
                                                    albumId: item.AlbumId || item.ParentId || '',
                                                    albumName: item.Album || '',
                                                },
                                                true
                                            );
                                            closeSearch();
                                        } else {
                                            navigate(getItemUrl(item.Type, item.Id));
                                            closeSearch();
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <div
                                            className={`relative overflow-hidden shrink-0 ${posterClass}`}
                                        >
                                            <SearchResultImage
                                                src={posterUrls[item.Id!]}
                                                alt={item.Name || ''}
                                                type={item.Type}
                                                className="w-full h-full"
                                            />
                                        </div>
                                        <div className="flex flex-col justify-start min-w-0 flex-1">
                                            <div className="flex items-center">
                                                <p className="text-lg line-clamp-1 text-ellipsis break-all">
                                                    {item.Name || ''}
                                                </p>
                                                <Badge variant={'outline'} className="flex ml-2">
                                                    <JellyfinItemKindIcon kind={item.Type!} />
                                                    {t('itemtype_' + item.Type?.toLowerCase())}
                                                </Badge>
                                            </div>
                                            <ItemDescription item={item} />
                                            {item.Overview && item.Type !== 'MusicAlbum' && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-2">
                                                    {item.Overview}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            );
                        })}
                    </>
                ) : (
                    <CommandEmpty>{t('no_results')}</CommandEmpty>
                )}
            </CommandList>
        </CommandDialog>
    );
};
