import ItemPagination from '@/components/ItemPagination';
import StudioCard from '@/components/StudioCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudiosByItemCount } from '@/hooks/api/useStudiosApi';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import Page from '../Page';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '../../components/ui/button';
import { PackageOpen } from 'lucide-react';

const GRID_COLS = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
const PAGE_SIZE = 48;
const SEARCH_DEBOUNCE_MS = 300;

const StudiosPage = () => {
    const { t } = useTranslation('library');
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page') ?? '0') || 0;
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        if (search === debouncedSearch) return;

        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setSearchParams(new URLSearchParams({ page: '0' }), { replace: true });
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(handler);
    }, [search, debouncedSearch, setSearchParams]);

    const { data, isLoading } = useStudiosByItemCount({
        limit: PAGE_SIZE,
        hasThumb: false,
        startIndex: page * PAGE_SIZE,
        search: debouncedSearch,
    });

    const studios = data?.items;
    const totalPages = data?.totalCount ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

    const handlePageChange = (p: number) => {
        const next = new URLSearchParams(searchParams);
        next.set('page', String(p));
        setSearchParams(next, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Page title={t('studios')} pagePadding requiresAuth>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h1 className="text-2xl font-bold">{t('studios')}</h1>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('studios_search_placeholder')}
                        className="sm:w-64"
                    />
                </div>

                {isLoading ? (
                    <div className={`w-full gap-4 grid ${GRID_COLS}`}>
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <Skeleton key={i} className="w-full aspect-video rounded-md" />
                        ))}
                    </div>
                ) : studios && studios.length > 0 ? (
                    <>
                        <div className={`w-full gap-4 grid ${GRID_COLS}`}>
                            {studios.map((studio) => (
                                <StudioCard studio={studio} key={studio.id} />
                            ))}
                        </div>
                        <ItemPagination
                            totalPages={totalPages}
                            currentPage={page}
                            onPageChange={handlePageChange}
                        />
                    </>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <PackageOpen />
                            </EmptyMedia>
                            <EmptyTitle>{t('no_studios_found_title')}</EmptyTitle>
                            <EmptyDescription>
                                {debouncedSearch
                                    ? t('no_studios_found_for_search', { search: debouncedSearch })
                                    : t('no_studios_found')}
                            </EmptyDescription>
                        </EmptyHeader>
                        {search && (
                            <EmptyContent className="flex-row justify-center gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearch('');
                                        setDebouncedSearch('');
                                        setSearchParams(new URLSearchParams({ page: '0' }), {
                                            replace: true,
                                        });
                                    }}
                                >
                                    {t('clear_search')}
                                </Button>
                            </EmptyContent>
                        )}
                    </Empty>
                )}
            </div>
        </Page>
    );
};

export default StudiosPage;
