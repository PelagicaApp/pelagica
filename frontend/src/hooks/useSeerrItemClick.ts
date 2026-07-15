import { useNavigate } from 'react-router';
import type { SeerrMediaInfo, SeerrMediaType } from '@/api/seerr/types';
import { useSeerrItemDialog } from '@/context/SeerrItemDialogContext';

export function useSeerrItemClick() {
    const navigate = useNavigate();
    const { openDialog } = useSeerrItemDialog();

    return (item: { id: number; mediaType: SeerrMediaType; mediaInfo?: SeerrMediaInfo }) => {
        if (item.mediaInfo?.jellyfinMediaId) {
            navigate(`/item/${item.mediaInfo.jellyfinMediaId}`);
            return;
        }
        openDialog({ id: item.id, mediaType: item.mediaType });
    };
}
