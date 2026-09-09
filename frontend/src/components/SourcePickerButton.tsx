import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';
import { Check, ChevronDown, Play } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { buildPlayerUrl, type PlayerTrackSelection } from '@/utils/playerUrl';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ButtonGroup, ButtonGroupSeparator } from './ui/button-group';

type MediaSource = NonNullable<BaseItemDto['MediaSources']>[number];

interface SourcePickerButtonProps {
    itemId: string;
    mediaSources?: MediaSource[] | null;
    isCurrentlyPlaying: boolean;
    playLabel: string;
    resumeLabel: string;
    /** When provided, source selection is controlled by the parent */
    selectedSourceId?: string;
    onSourceChange?: (sourceId: string | undefined) => void;
    trackSelection?: PlayerTrackSelection;
}

const SourcePickerButton = ({
    itemId,
    mediaSources,
    isCurrentlyPlaying,
    playLabel,
    resumeLabel,
    selectedSourceId: controlledSourceId,
    onSourceChange,
    trackSelection,
}: SourcePickerButtonProps) => {
    const location = useLocation();
    const [internalSourceId, setInternalSourceId] = useState<string | undefined>(
        mediaSources?.[0]?.Id ?? undefined
    );
    const selectedSourceId = controlledSourceId ?? internalSourceId;
    const selectedSource =
        mediaSources?.find((source) => source.Id === selectedSourceId) ?? mediaSources?.[0];

    const handleSourceSelect = (sourceId: string | undefined) => {
        setInternalSourceId(sourceId);
        onSourceChange?.(sourceId);
    };

    const hasMultipleSources = (mediaSources?.length ?? 0) > 1;

    return (
        <ButtonGroup className="relative inline-flex">
            <Button className={hasMultipleSources ? 'rounded-r-none w-min' : 'w-min'} asChild>
                <Link
                    to={buildPlayerUrl(
                        selectedSource?.Id ?? itemId,
                        location.pathname + location.search,
                        trackSelection
                    )}
                >
                    <Play />
                    {isCurrentlyPlaying ? resumeLabel : playLabel}
                </Link>
            </Button>

            {hasMultipleSources && (
                <>
                    <ButtonGroupSeparator />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="rounded-l-none px-2" aria-label={playLabel}>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-64">
                            {mediaSources?.map((source) => (
                                <DropdownMenuItem
                                    key={source.Id}
                                    onSelect={() => handleSourceSelect(source.Id ?? undefined)}
                                >
                                    <Check
                                        className={cn(
                                            'h-4 w-4 shrink-0',
                                            source.Id === selectedSource?.Id
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                        )}
                                    />
                                    <span className="flex-1 truncate text-left">{source.Name}</span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {source.Size
                                            ? `${(source.Size / 1e9).toFixed(1)} GB`
                                            : null}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        </ButtonGroup>
    );
};

export default SourcePickerButton;
