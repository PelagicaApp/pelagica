import { Button } from '@/components/ui/button';
import { useFavorite } from '@/hooks/api/useFavorite';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FavoriteButtonProps {
    item: BaseItemDto;
    showFavoriteButton?: boolean | undefined;
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg' | null | undefined;
    variant?:
        | 'default'
        | 'link'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | null
        | undefined;
}

const FavoriteButton = ({
    item,
    showFavoriteButton,
    size = 'icon',
    variant = 'outline',
}: FavoriteButtonProps) => {
    const { t } = useTranslation('item');
    const { isFavorite, toggleFavorite, isLoading: isFavoriteLoading } = useFavorite(item.Id);

    if (showFavoriteButton === false) return null;

    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => toggleFavorite(!isFavorite)}
            disabled={isFavoriteLoading}
            title={isFavorite ? t('unfavorite') : t('favorite')}
        >
            <Heart fill={isFavorite ? 'currentColor' : 'none'} />
        </Button>
    );
};

export default FavoriteButton;
