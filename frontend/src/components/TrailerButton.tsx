import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Button } from './ui/button';
import { ChevronDown, ExternalLink, Film } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { buildPlayerUrl } from '@/utils/playerUrl';
import { useLocalTrailers } from '@/hooks/api/useLocalTrailers';
import { ButtonGroup } from './ui/button-group';
import { forwardRef, type ComponentProps } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

interface PlayableTrailer {
    id: string;
    url: string;
    type: 'local' | 'remote';
    name: string;
}

const TrailerLink = forwardRef<
    HTMLAnchorElement,
    { trailer: PlayableTrailer; showName?: boolean } & ComponentProps<'a'>
>(({ trailer, showName = true, ...props }, ref) => {
    const { t } = useTranslation('item');

    if (!trailer.url) return null;

    const Icon = trailer.type === 'local' ? Film : ExternalLink;

    if (trailer.type === 'local') {
        return (
            <Link to={trailer.url} ref={ref} {...props}>
                <Icon />
                {showName ? trailer.name : t('trailer')}
            </Link>
        );
    }

    return (
        <a href={trailer.url} target="_blank" rel="noopener noreferrer" ref={ref} {...props}>
            <Icon />
            <span>{showName ? trailer.name : t('trailer')}</span>
        </a>
    );
});

export const TrailerButton = ({ item }: { item: BaseItemDto }) => {
    const { t } = useTranslation('item');
    const location = useLocation();
    const hasLocalTrailers = (item.LocalTrailerCount ?? 0) > 0;
    const { data: localTrailers } = useLocalTrailers(item.Id ?? undefined, hasLocalTrailers);

    const trailers: (PlayableTrailer | null)[] = [];

    trailers.push(
        ...(localTrailers?.map((trailer) => {
            if (!trailer.Id) return null;
            return {
                id: trailer.Id,
                url: buildPlayerUrl(trailer.Id, location.pathname + location.search),
                type: 'local' as const,
                name: trailer.Name ?? t('localTrailer'),
            };
        }) ?? [])
    );

    trailers.push(
        ...(item.RemoteTrailers?.map((trailer) => {
            if (!trailer.Url) return null;
            return {
                id: trailer.Url,
                url: trailer.Url,
                type: 'remote' as const,
                name: trailer.Name ?? t('remoteTrailer'),
            };
        }) ?? [])
    );

    const playableTrailers = trailers.filter(
        (trailer): trailer is PlayableTrailer => trailer !== null
    );

    if (playableTrailers.length === 0) return null;

    const hasMultipleTrailers = playableTrailers.length > 1;

    return (
        <ButtonGroup className="relative inline-flex">
            <Button
                variant="outline"
                className={hasMultipleTrailers ? 'rounded-r-none w-min' : 'w-min'}
                asChild
            >
                <TrailerLink trailer={playableTrailers[0]} showName={false} />
            </Button>

            {hasMultipleTrailers && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="rounded-l-none px-2"
                            aria-label={t('playTrailer')}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-64">
                        {playableTrailers?.map((trailer) => (
                            <DropdownMenuItem key={trailer.id} asChild>
                                <TrailerLink trailer={trailer} />
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </ButtonGroup>
    );
};
