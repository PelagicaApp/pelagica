import { Button } from '@/components/ui/button';
import { Radar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSeerrItemDialog } from '@/context/SeerrItemDialogContext';
import type { SeerrMediaType } from '@/api/seerr/types';

interface SeerrItemButtonProps {
    tmdbId: string;
    mediaType: SeerrMediaType;
}

const SeerrItemButton = ({ tmdbId, mediaType }: SeerrItemButtonProps) => {
    const { t } = useTranslation('seerr');
    const { openDialog } = useSeerrItemDialog();

    return (
        <Button
            variant="outline"
            size="icon"
            title={t('seerr_button_label')}
            onClick={() => openDialog({ id: Number(tmdbId), mediaType })}
        >
            <Radar />
        </Button>
    );
};

export default SeerrItemButton;
