import { useNavigate } from 'react-router';
import { SeerrMediaStatus, type SeerrMediaInfo, type SeerrMediaType } from '@/api/seerr/types';
import { useSeerrItemDialog } from '@/context/SeerrItemDialogContext';

export function useSeerrItemClick() {
    const navigate = useNavigate();
    const { openDialog } = useSeerrItemDialog();

    return (item: { id: number; mediaType: SeerrMediaType; mediaInfo?: SeerrMediaInfo }) => {
        // Only skip the modal for fully available items since seasons can be partially available (e.g. only one season)
        if (
            item.mediaInfo?.jellyfinMediaId &&
            item.mediaInfo.status === SeerrMediaStatus.AVAILABLE
        ) {
            navigate(`/item/${item.mediaInfo.jellyfinMediaId}`);
            return;
        }
        openDialog({ id: item.id, mediaType: item.mediaType });
    };
}
