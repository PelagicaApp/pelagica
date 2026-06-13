import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Button } from './ui/button';
import { Film } from 'lucide-react';

export const TrailerButton = ({ item }: { item: BaseItemDto }) => {
    if (!item.RemoteTrailers || item.RemoteTrailers.length === 0) return null;

    const firstTrailer = item.RemoteTrailers[0];
    if (!firstTrailer.Url) return null;

    return (
        <Button variant="outline" asChild>
            <a href={firstTrailer.Url} target="_blank" rel="noopener noreferrer">
                <Film />
                Trailer
            </a>
        </Button>
    );
};
