import type { AppConfig } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import BaseMusicListPage from './BaseMusicListPage';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

interface PlaylistPageProps {
    item: BaseItemDto;
    config: AppConfig;
}

const PlaylistPage = ({ item, config }: PlaylistPageProps) => {
    const { t } = useTranslation('item');

    return <BaseMusicListPage item={item} config={config} listType={t('playlist')} />;
};

export default PlaylistPage;
