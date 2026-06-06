import { useEffect, useMemo, useState, useTransition } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { useSearch } from '@/context/SearchContext';
import { useSearchItems } from '@/hooks/api/useSearchItems';
import { useNavigate } from 'react-router';
import { Skeleton } from './ui/skeleton';
import { Calendar, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import JellyfinItemKindIcon from './JellyfinItemKindIcon';
import { Badge } from './ui/badge';
import { getPrimaryImageUrl } from '../utils/jellyfinUrls';

export const SearchCommand = () => {
    const { t } = useTranslation('search');
    const { isOpen, closeSearch } = useSearch();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [, startTransition] = useTransition();
    const {
        data: results,
        isLoading,
        error,
    } = useSearchItems(debouncedQuery, {
        itemTypes: ['Movie', 'Series'],
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
                placeholder={t('input_placeholder')}
                value={query}
                onValueChange={setQuery}
            />
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
                        {results.map((item) => (
                            <CommandItem
                                key={item.Id}
                                value={item.Name!}
                                onSelect={() => {
                                    navigate(`/item/${item.Id}`);
                                    closeSearch();
                                }}
                            >
                                <div className="flex items-start gap-3 w-full">
                                    <div className="relative w-13 h-20 overflow-hidden rounded-md shrink-0">
                                        <img
                                            src={posterUrls[item.Id!]}
                                            alt={item.Name || ''}
                                            className="w-full h-full object-cover rounded-md"
                                            loading="lazy"
                                        />
                                        <Skeleton className="absolute bottom-0 left-0 right-0 top-0 -z-1" />
                                    </div>
                                    <div className="flex flex-col justify-start min-w-0 flex-1">
                                        <div className="flex items-center">
                                            <p className="text-lg line-clamp-1 text-ellipsis break-all">
                                                {item.Name || ''}
                                            </p>
                                            <Badge variant={'outline'} className="flex ml-2">
                                                <JellyfinItemKindIcon kind={item.Type!} />
                                                {item.Type}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
                                        </div>
                                        {item.Overview && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-2">
                                                {item.Overview}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CommandItem>
                        ))}
                    </>
                ) : (
                    <CommandEmpty>{t('no_results')}</CommandEmpty>
                )}
            </CommandList>
        </CommandDialog>
    );
};
