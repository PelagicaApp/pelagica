import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import {
    Baby,
    Clapperboard,
    Heart,
    LayoutGrid,
    Newspaper,
    SearchIcon,
    Trophy,
    Tv,
    XIcon,
} from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { ButtonGroup } from '../../components/ui/button-group';
import { Button } from '../../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { ALL_CATEGORY_FILTERS, type ChannelCategoryFilter } from './liveTvChannelFilters';

const CATEGORY_FILTER_ICONS: Record<ChannelCategoryFilter, JSX.Element> = {
    all: <LayoutGrid />,
    favorites: <Heart />,
    movies: <Clapperboard />,
    series: <Tv />,
    news: <Newspaper />,
    kids: <Baby />,
    sports: <Trophy />,
};

interface LiveTvChannelSearchBarProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    categoryFilter: ChannelCategoryFilter;
    onCategoryFilterChange: (value: ChannelCategoryFilter) => void;
    className?: string;
}

const LiveTvChannelSearchBar = ({
    searchTerm,
    onSearchTermChange,
    categoryFilter,
    onCategoryFilterChange,
    className,
}: LiveTvChannelSearchBarProps) => {
    const { t } = useTranslation('live');

    return (
        <ButtonGroup className={className}>
            <InputGroup className="grow">
                <InputGroupAddon>
                    <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                    placeholder={t('search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
                <InputGroupAddon hidden={!searchTerm} align="inline-end">
                    <Button variant="ghost" size="icon-sm" onClick={() => onSearchTermChange('')}>
                        <XIcon />
                    </Button>
                </InputGroupAddon>
            </InputGroup>
            <Select
                value={categoryFilter}
                onValueChange={(v) => onCategoryFilterChange(v as ChannelCategoryFilter)}
            >
                <SelectTrigger className="min-w-30 sm:min-w-40">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {ALL_CATEGORY_FILTERS.map((filter) => (
                        <SelectItem key={filter} value={filter}>
                            {CATEGORY_FILTER_ICONS[filter]}
                            {t(`filter_${filter}`)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ButtonGroup>
    );
};

export default LiveTvChannelSearchBar;
