import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalTrailers } from '@pelagica/core';
import FocusableButton from './FocusableButton';
import { useLocation, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { buildPlayerUrl } from '@/lib/playerUrl';

interface TrailerButtonProps {
    item: BaseItemDto;
}

const TrailerButton = ({ item }: TrailerButtonProps) => {
    const hasLocalTrailers = (item.LocalTrailerCount ?? 0) > 0;
    const navigate = useNavigate();
    const location = useLocation();
    const { data: localTrailers } = useLocalTrailers(item.Id ?? undefined, hasLocalTrailers);

    if (!hasLocalTrailers || !localTrailers || localTrailers.length === 0) {
        return null;
    }

    const firstTrailer = localTrailers[0];

    return (
        <FocusableButton
            variant="outline"
            size="lg"
            onClick={() =>
                navigate(buildPlayerUrl(firstTrailer.Id!, location.pathname + location.search))
            }
        >
            <Film />
            Trailer
        </FocusableButton>
    );
};

export default TrailerButton;
