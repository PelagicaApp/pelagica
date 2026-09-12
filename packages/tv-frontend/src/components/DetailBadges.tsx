import { Badge } from '@/components/ui/badge';
import type { AppConfig } from '@pelagica/core';
import { getDetailBadgeValue } from '@pelagica/core';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Award, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DetailBadgesProps {
    item: BaseItemDto;
    appConfig: AppConfig;
}

const DetailBadges = ({ item, appConfig }: DetailBadgesProps) => {
    const { t } = useTranslation('item');
    const detailBadges = appConfig.itemPage?.detailBadges;

    if (!detailBadges || detailBadges.length === 0) return null;

    const badgeElements = detailBadges
        .map((badgeType) => {
            const badgeValue = getDetailBadgeValue(item, badgeType, t);
            if (!badgeValue) return null;

            return (
                <Badge key={badgeType} variant={'outline'}>
                    {badgeValue.kind === 'icon-text' ? (
                        <div className="flex items-center gap-1">
                            {badgeValue.icon === 'star' ? <Star /> : <Award />}
                            {badgeValue.text}
                        </div>
                    ) : (
                        badgeValue.text
                    )}
                </Badge>
            );
        })
        .filter(Boolean);

    return badgeElements.length > 0 ? (
        <div className="flex flex-wrap gap-2">{badgeElements}</div>
    ) : null;
};

export default DetailBadges;
