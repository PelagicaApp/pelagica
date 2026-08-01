import { memo, useEffect, useState, useTransition, type JSX } from 'react';
import { useSearchParams } from 'react-router';
import Page from '../Page';
import { useSearchItems } from '@/hooks/api/useSearchItems';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import {
    CircleQuestionMark,
    Clapperboard,
    LayoutGrid,
    Music,
    SearchIcon,
    TriangleAlert,
    XIcon,
} from 'lucide-react';
import { ButtonGroup } from '@/components/ui/button-group';
import MovieTvGrid from './MovieTvGrid';
import MusicGrid from './MusicGrid';
import PeopleGrid from './PeopleGrid';
import EpisodesGrid from './EpisodesGrid';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { useTranslation } from 'react-i18next';
import GenresGrid from './GenresGrid';
import SeerrSearchGrid from './SeerrSearchGrid';
import { getUserId } from '@/utils/localstorageCredentials';
import { useConfig } from '@/hooks/api/useConfig';
import { useSeerrLoginStatus } from '@/hooks/api/useSeerrLoginStatus';
import { useSeerrSearch } from '@/hooks/api/useSeerrSearch';
import { SeerrMediaStatus } from '@/api/seerr/types';

const ITEM_TYPE_GROUPS = {
    episodes: ['Episode'] as BaseItemKind[],
    moviesTv: ['Movie', 'Series'] as BaseItemKind[],
    music: ['MusicAlbum'] as BaseItemKind[],
    people: ['Person'] as BaseItemKind[],
} as const;

const LoadingSkeleton = memo(() => (
    <div className="space-y-8 mt-4 w-full">
        {[1, 2].map((section) => (
            <div key={section}>
                <Skeleton className="h-7 w-40 mb-4" />
                <div className="w-full gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
                        <div key={item} className="space-y-2">
                            <Skeleton className="aspect-2/3 w-full rounded-lg" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
));

type SearchTypeFilter = 'all' | 'movies-tv' | 'music';
const ALL_TYPE_FILTERS: SearchTypeFilter[] = ['all', 'movies-tv', 'music'];
const ITEM_TYPE_FILTER_MAP: Record<SearchTypeFilter, BaseItemKind[] | undefined> = {
    all: ['MusicAlbum', 'Movie', 'Series', 'Episode', 'Person'],
    'movies-tv': ['Movie', 'Series'],
    music: ['MusicAlbum'],
};
const ITEM_TYPE_FILTER_ICONS: Record<SearchTypeFilter, JSX.Element> = {
    all: <LayoutGrid />,
    'movies-tv': <Clapperboard />,
    music: <Music />,
};

const SearchPage = () => {
    const { t } = useTranslation('search');
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
    const [typeFilter, setTypeFilter] = useState<SearchTypeFilter>(
        (searchParams.get('type') as SearchTypeFilter) || 'movies-tv'
    );
    const [, startTransition] = useTransition();
    const itemTypes: BaseItemKind[] | undefined = ITEM_TYPE_FILTER_MAP[typeFilter];
    const {
        data: results,
        isLoading,
        error,
    } = useSearchItems(debouncedQuery, { itemTypes, limit: 50, userId: getUserId() || undefined });

    const { config } = useConfig();
    const { data: isSeerrLoggedIn } = useSeerrLoginStatus();
    const showSeerrResults = !!config?.seerrUrl && isSeerrLoggedIn && typeFilter !== 'music';
    const { data: seerrResults, isLoading: isLoadingSeerrResults } = useSeerrSearch(
        showSeerrResults ? debouncedQuery : undefined
    );
    const visibleSeerrResults = seerrResults?.filter(
        (item) => item.mediaInfo?.status !== SeerrMediaStatus.AVAILABLE
    );

    useEffect(() => {
        const handler = setTimeout(() => {
            startTransition(() => {
                setDebouncedQuery(query);
                const params = new URLSearchParams();
                if (query) params.set('q', query);
                params.set('type', typeFilter);
                setSearchParams(params, { replace: true });
            });
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [query, typeFilter, setSearchParams]);

    return (
        <Page title="Search" className="flex-1 flex flex-col items-center">
            <ButtonGroup className="w-full mt-0.5 max-w-2xl mb-1">
                <InputGroup className="grow">
                    <InputGroupAddon>
                        <SearchIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                        placeholder={t('input_placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <InputGroupAddon hidden={!query} align={'inline-end'}>
                        <Button variant={'ghost'} size={'icon-sm'} onClick={() => setQuery('')}>
                            <XIcon />
                        </Button>
                    </InputGroupAddon>
                </InputGroup>
                <Select
                    value={typeFilter}
                    onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
                >
                    <SelectTrigger className="min-w-30 sm:min-w-40">
                        <SelectValue placeholder="Types" />
                    </SelectTrigger>
                    <SelectContent>
                        {ALL_TYPE_FILTERS.map((filter) => (
                            <SelectItem key={filter} value={filter}>
                                {ITEM_TYPE_FILTER_ICONS[filter]}
                                {t('typefilter_' + filter)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </ButtonGroup>
            {isLoading && <LoadingSkeleton />}
            {error && (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <TriangleAlert />
                        </EmptyMedia>
                        <EmptyTitle>{t('unexpected_error')}</EmptyTitle>
                        <EmptyDescription>{t('error_occurred_while_searching')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}
            {!isLoading &&
                !error &&
                results &&
                results.length === 0 &&
                (!showSeerrResults || (!isLoadingSeerrResults && !visibleSeerrResults?.length)) && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <CircleQuestionMark />
                            </EmptyMedia>
                            <EmptyTitle>{t('no_results')}</EmptyTitle>
                            <EmptyDescription>{t('no_results_description')}</EmptyDescription>
                            <EmptyContent>
                                <Button variant={'link'} onClick={() => setQuery('')}>
                                    {t('clear_search')}
                                </Button>
                            </EmptyContent>
                        </EmptyHeader>
                    </Empty>
                )}
            {results &&
                Object.keys(ITEM_TYPE_GROUPS).map((groupKey) => {
                    const groupItemTypes =
                        ITEM_TYPE_GROUPS[groupKey as keyof typeof ITEM_TYPE_GROUPS];
                    if (
                        typeFilter !== 'all' &&
                        ((typeFilter === 'music' && groupKey !== 'music') ||
                            (typeFilter === 'movies-tv' && groupKey === 'music'))
                    ) {
                        return null;
                    }

                    const groupResults = results.filter((item) =>
                        groupItemTypes.includes(item.Type as BaseItemKind)
                    );
                    if (groupResults.length === 0) return null;

                    if (groupKey === 'moviesTv') {
                        return (
                            <div key={groupKey} className="mt-4 w-full">
                                <h2 className="text-2xl font-bold mb-2">{t('group_moviesTv')}</h2>
                                <MovieTvGrid items={groupResults} />
                            </div>
                        );
                    }

                    if (groupKey === 'music') {
                        return (
                            <div key={groupKey} className="mt-4 w-full">
                                <h2 className="text-2xl font-bold mb-2">{t('group_music')}</h2>
                                <MusicGrid items={groupResults} />
                            </div>
                        );
                    }

                    if (groupKey === 'people') {
                        return (
                            <div key={groupKey} className="mt-4 w-full">
                                <h2 className="text-2xl font-bold mb-2">{t('group_people')}</h2>
                                <PeopleGrid items={groupResults} />
                            </div>
                        );
                    }

                    if (groupKey === 'episodes') {
                        return (
                            <div key={groupKey} className="mt-4 w-full">
                                <h2 className="text-2xl font-bold mb-2">{t('group_episodes')}</h2>
                                <EpisodesGrid items={groupResults} />
                            </div>
                        );
                    }

                    return null;
                })}
            {showSeerrResults &&
            debouncedQuery &&
            (isLoadingSeerrResults || visibleSeerrResults?.length) ? (
                <div className="mt-4 w-full">
                    <h2 className="text-2xl font-bold mb-2">{t('group_seerr')}</h2>
                    {isLoadingSeerrResults ? (
                        <div className="w-full gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
                            {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                                <div key={item} className="space-y-2">
                                    <Skeleton className="aspect-2/3 w-full rounded-lg" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <SeerrSearchGrid items={visibleSeerrResults || []} />
                    )}
                </div>
            ) : null}
            {!debouncedQuery && !isLoading && <GenresGrid />}
        </Page>
    );
};

export default SearchPage;
