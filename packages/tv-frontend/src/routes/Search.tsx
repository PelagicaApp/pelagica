import FocusableField from '@/components/FocusableField';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { getUserId, useGenresWithItems, useSearchItems } from '@pelagica/core';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useLayerFocusable } from '@/router/useLayerFocusable';
import { useLayerId } from '@/router';
import { CircleQuestionMark, SearchIcon, TriangleAlert } from 'lucide-react';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GenreCard from '../components/GenreCard';
import { Skeleton } from '../components/ui/skeleton';
import ItemCardGrid from '../components/ItemCardGrid';

const SEARCH_GENRE_GRID_LIMIT = 20;

const Search = () => {
    const { t } = useTranslation('search');
    const { data: genres } = useGenresWithItems({ limit: SEARCH_GENRE_GRID_LIMIT });
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const searchInputFocusKey = `${useLayerId()}:search-page-input`;
    const { ref, focusKey } = useLayerFocusable<object, HTMLDivElement>({
        preferredChildFocusKey: searchInputFocusKey,
    });
    const {
        data: results,
        isLoading,
        error,
    } = useSearchItems(debouncedQuery, {
        itemTypes: ['Movie', 'Series'],
        limit: 50,
        userId: getUserId() || undefined,
    });

    const sortedGenres = useMemo(
        () =>
            genres
                ? [...genres].sort((a, b) => (b.item?.totalItems || 0) - (a.item?.totalItems || 0))
                : undefined,
        [genres]
    );

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

    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className="flex flex-col gap-6">
                <FocusableField
                    focusKey={searchInputFocusKey}
                    type="text"
                    placeholder={t('input_placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    icon={<SearchIcon />}
                />
                <ItemCardGrid items={results} isLoading={isLoading} />
                {error && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <TriangleAlert />
                            </EmptyMedia>
                            <EmptyTitle>{t('unexpected_error')}</EmptyTitle>
                            <EmptyDescription>
                                {t('error_occurred_while_searching')}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
                {!isLoading && !error && results && results.length === 0 && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <CircleQuestionMark />
                            </EmptyMedia>
                            <EmptyTitle>{t('no_results')}</EmptyTitle>
                            <EmptyDescription>{t('no_results_description')}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
                {!query && !isLoading && !error && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
                        {sortedGenres
                            ? sortedGenres.map((genre) => (
                                  <GenreCard
                                      key={genre.id}
                                      genreWithItem={genre}
                                      className="w-full"
                                      autoFocus={false}
                                  />
                              ))
                            : Array.from({ length: 12 }).map((_, i) => (
                                  <div
                                      key={i}
                                      className="relative block w-full aspect-video rounded-md"
                                  >
                                      <Skeleton className="w-full h-full rounded-md" />
                                  </div>
                              ))}
                    </div>
                )}
            </div>
        </FocusContext.Provider>
    );
};

export default Search;
