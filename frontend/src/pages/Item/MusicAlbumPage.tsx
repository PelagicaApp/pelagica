import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import BaseMusicListPage from './BaseMusicListPage';
import { useTranslation } from 'react-i18next';
import type { AppConfig } from '@pelagica/core';

interface MusicAlbumPageProps {
    item: BaseItemDto;
    config: AppConfig;
}

const MusicAlbumPage = ({ item, config }: MusicAlbumPageProps) => {
    const { t } = useTranslation('item');

    return <BaseMusicListPage item={item} config={config} listType={t('album')} />;
};

export default MusicAlbumPage;
