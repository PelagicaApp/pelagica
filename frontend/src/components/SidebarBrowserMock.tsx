'use client';

import { useEffect, useMemo, useState } from 'react';
import { Film, Music2, Search, Tv } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { SidebarInput, useSidebar } from '@/components/ui/sidebar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    type BrowserMediaCategory,
    type BrowserMockItem,
    useSidebarBrowserMock,
} from '@/context/SidebarBrowserMockContext';
import { useUserViews } from '@/hooks/api/useUserViews';
import {
    buildLibrarySearchParams,
    collectionTypeToCategory,
    findLibraryIdForCategory,
} from '@/utils/sidebarLibraryNavigation';

const MOCK_ITEMS: BrowserMockItem[] = [
    {
        id: 'album-1',
        title: 'Kind of Blue',
        subtitle: 'Miles Davis',
        category: 'music',
        kind: 'Album',
        accent: 'from-sky-600 to-indigo-800',
        description:
            'A landmark modal jazz record. Cool, spacious arrangements that defined an era.',
        meta: [
            { label: 'Year', value: '1959' },
            { label: 'Tracks', value: '5' },
            { label: 'Duration', value: '45 min' },
        ],
    },
    {
        id: 'artist-1',
        title: 'Fleetwood Mac',
        subtitle: '12 albums · 4.2M monthly listeners',
        category: 'music',
        kind: 'Artist',
        accent: 'from-amber-500 to-rose-700',
        description: 'British-American rock band known for lush harmonies and Rumours-era classics.',
        meta: [
            { label: 'Genre', value: 'Rock' },
            { label: 'Origin', value: 'London' },
        ],
    },
    {
        id: 'playlist-1',
        title: 'Late Night Focus',
        subtitle: 'Pelagica · 48 tracks',
        category: 'music',
        kind: 'Playlist',
        accent: 'from-violet-600 to-fuchsia-900',
        description: 'Instrumental and downtempo picks for deep work after midnight.',
        meta: [
            { label: 'Updated', value: '2 days ago' },
            { label: 'Duration', value: '3 hr 12 min' },
        ],
    },
    {
        id: 'series-1',
        title: 'Severance',
        subtitle: 'Season 2 · Thriller',
        category: 'series',
        kind: 'TV Show',
        accent: 'from-emerald-700 to-teal-950',
        description:
            'Employees undergo a procedure that splits work and personal memories. Mystery deepens in Lumon.',
        meta: [
            { label: 'Episodes', value: '10' },
            { label: 'Rating', value: 'TV-MA' },
        ],
    },
    {
        id: 'series-2',
        title: 'The Bear',
        subtitle: 'Season 3 · Drama',
        category: 'series',
        kind: 'TV Show',
        accent: 'from-orange-600 to-red-900',
        description:
            "Carmy pushes Chicago's finest sandwich shop toward something bigger—and harder.",
        meta: [
            { label: 'Episodes', value: '10' },
            { label: 'Status', value: 'Continuing' },
        ],
    },
    {
        id: 'movie-1',
        title: 'Dune: Part Two',
        subtitle: '2024 · Sci-Fi',
        category: 'movie',
        kind: 'Movie',
        accent: 'from-amber-700 to-stone-900',
        description:
            'Paul Atreides unites with the Fremen while facing choices that will change the universe.',
        meta: [
            { label: 'Runtime', value: '2 hr 46 min' },
            { label: 'Rating', value: 'PG-13' },
        ],
    },
    {
        id: 'movie-2',
        title: 'Past Lives',
        subtitle: '2023 · Romance',
        category: 'movie',
        kind: 'Movie',
        accent: 'from-pink-500 to-purple-900',
        description:
            'Two childhood friends reunite in New York and confront paths not taken over twenty-four years.',
        meta: [
            { label: 'Runtime', value: '1 hr 46 min' },
            { label: 'Awards', value: 'Oscar nominee' },
        ],
    },
    {
        id: 'album-2',
        title: 'Blonde',
        subtitle: 'Frank Ocean',
        category: 'music',
        kind: 'Album',
        accent: 'from-neutral-500 to-neutral-900',
        description: 'An intimate, experimental R&B album exploring memory, love, and identity.',
        meta: [
            { label: 'Year', value: '2016' },
            { label: 'Tracks', value: '17' },
        ],
    },
];

const CATEGORY_OPTIONS: {
    value: BrowserMediaCategory | 'all';
    label: string;
    icon: React.ReactNode;
}[] = [
    { value: 'all', label: 'All media', icon: <Search className="size-4" /> },
    { value: 'music', label: 'Music', icon: <Music2 className="size-4" /> },
    { value: 'series', label: 'Series', icon: <Tv className="size-4" /> },
    { value: 'movie', label: 'Movies', icon: <Film className="size-4" /> },
];

function categoryIcon(category: BrowserMediaCategory) {
    switch (category) {
        case 'music':
            return <Music2 className="size-3.5 shrink-0 text-white/90" />;
        case 'series':
            return <Tv className="size-3.5 shrink-0 text-white/90" />;
        case 'movie':
            return <Film className="size-3.5 shrink-0 text-white/90" />;
    }
}

type SidebarBrowserMockProps = {
    className?: string;
};

export function SidebarBrowserMock({ className }: SidebarBrowserMockProps) {
    const { state, isMobile } = useSidebar();
    const { selectedItem, setSelectedItem } = useSidebarBrowserMock();
    const { data: views } = useUserViews();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');

    const libraryIdFromUrl = searchParams.get('library');
    const categoryFromUrl = useMemo(() => {
        if (location.pathname !== '/library' || !libraryIdFromUrl) return 'all' as const;
        const library = views?.Items?.find((item) => item.Id === libraryIdFromUrl);
        return collectionTypeToCategory(library?.CollectionType);
    }, [location.pathname, libraryIdFromUrl, views?.Items]);

    const [category, setCategory] = useState<BrowserMediaCategory | 'all'>(categoryFromUrl);

    useEffect(() => {
        setCategory(categoryFromUrl);
    }, [categoryFromUrl]);

    const navigateToLibraryForCategory = (nextCategory: BrowserMediaCategory | 'all') => {
        const libraryId = findLibraryIdForCategory(views?.Items, nextCategory);
        if (!libraryId) return;
        navigate(`/library?${buildLibrarySearchParams(libraryId).toString()}`);
    };

    const handleCategoryChange = (value: BrowserMediaCategory | 'all') => {
        setCategory(value);
        setSelectedItem(null);
        navigateToLibraryForCategory(value);
    };

    const results = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return MOCK_ITEMS.filter((item) => {
            const matchesCategory = category === 'all' || item.category === category;
            if (!matchesCategory) return false;
            if (!normalized) return true;
            return (
                item.title.toLowerCase().includes(normalized) ||
                item.subtitle.toLowerCase().includes(normalized) ||
                item.kind.toLowerCase().includes(normalized)
            );
        });
    }, [query, category]);

    if (state === 'collapsed' && !isMobile) {
        return (
            <p className="text-muted-foreground px-3 py-6 text-center text-xs leading-relaxed">
                Expand the sidebar
                <span className="text-foreground block font-medium">Ctrl+B</span>
                to browse
            </p>
        );
    }

    return (
        <section
            data-testid="sidebar-browser-mock"
            className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-2', className)}
        >
            <div className="flex items-center justify-between gap-2 px-0.5">
                <h2 className="text-sm font-semibold leading-tight">Browse</h2>
                <span className="bg-primary/15 text-primary shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Mock
                </span>
            </div>

            <div className="relative shrink-0">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <SidebarInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="bg-background pl-8"
                />
            </div>

            <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-background w-full shrink-0" size="sm">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="text-muted-foreground flex shrink-0 items-center justify-between px-0.5 text-xs font-medium">
                    <span>Results</span>
                    <span className="tabular-nums">{results.length}</span>
                </div>
                <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border">
                    {results.length === 0 ? (
                        <li className="text-muted-foreground py-6 text-center text-sm">
                            No matches.
                        </li>
                    ) : (
                        results.map((item) => {
                            const isActive = selectedItem?.id === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItem(item)}
                                        className={cn(
                                            'hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors',
                                            isActive &&
                                                'bg-sidebar-accent text-sidebar-accent-foreground ring-primary/50 ring-1'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'bg-gradient-to-br flex size-9 shrink-0 items-center justify-center rounded-md',
                                                item.accent
                                            )}
                                        >
                                            {categoryIcon(item.category)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium leading-tight">
                                                {item.title}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {item.kind} · {item.subtitle}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
        </section>
    );
}
