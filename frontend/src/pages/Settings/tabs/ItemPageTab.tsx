import { useTranslation } from 'react-i18next';
import {
    DETAIL_BADGES,
    EPISODE_DISPLAYS,
    type AppConfig,
    type DetailBadge,
} from '@/hooks/api/useConfig';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { BooleanInput, SelectInput, MultiSelectInput } from '../components/SettingsInputs';

export const ItemPageTab = ({
    config,
    saveConfig,
}: {
    config: AppConfig;
    saveConfig: (updater: (prev: AppConfig) => AppConfig) => void;
}) => {
    const { t } = useTranslation('settings');
    const itemPage = config.itemPage || {};

    const updateItemPage = (partial: Partial<typeof itemPage>) => {
        saveConfig((prev) => ({
            ...prev,
            itemPage: { ...prev.itemPage, ...partial },
        }));
    };

    return (
        <div className="max-w-200">
            <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                {t('category_itempage')}
            </h1>
            <SelectInput
                label={t('episode_display_label')}
                options={EPISODE_DISPLAYS.map((display) => ({
                    value: display,
                    label: t(`episode_display_${display}`),
                }))}
                value={itemPage.episodeDisplay || 'row'}
                onChange={(value) => updateItemPage({ episodeDisplay: value as 'grid' | 'row' })}
                description={t('episode_display_description')}
            />
            <BooleanInput
                label={t('show_watchlist_button_label')}
                checked={itemPage.showWatchlistButton || false}
                onChange={(checked) => updateItemPage({ showWatchlistButton: checked })}
            />
            <BooleanInput
                label={t('show_download_button_label')}
                checked={itemPage.showDownloadButton || false}
                onChange={(checked) => updateItemPage({ showDownloadButton: checked })}
            />
            <MultiSelectInput
                label={t('favorite_button_types_label')}
                options={[
                    { value: 'Movie', label: t('movie') },
                    { value: 'Series', label: t('series') },
                    { value: 'Episode', label: t('episode') },
                    { value: 'BoxSet', label: t('box_set') },
                    { value: 'MusicArtist', label: t('artist') },
                    { value: 'MusicAlbum', label: t('music_album') },
                    { value: 'Playlist', label: t('playlist') },
                ]}
                selected={(itemPage.favoriteButton as string[]) || []}
                onChange={(selected) =>
                    updateItemPage({
                        favoriteButton: selected.length > 0 ? (selected as BaseItemKind[]) : [],
                    })
                }
                description={t('favorite_button_types_description')}
            />
            <MultiSelectInput
                label={t('detail_badges_label')}
                options={DETAIL_BADGES.map((badge) => ({
                    value: badge,
                    label: t(`detail_badges_${badge}`),
                }))}
                selected={(itemPage.detailBadges as string[]) || []}
                onChange={(selected) =>
                    updateItemPage({
                        detailBadges: selected.length > 0 ? (selected as DetailBadge[]) : [],
                    })
                }
                description={t('detail_badges_description')}
            />
        </div>
    );
};
