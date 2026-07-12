import { useTranslation } from 'react-i18next';
import type { AppConfig } from '@/hooks/api/useConfig';
import { useStatsConsent } from '@/hooks/api/statsConsent/useStatsConsent';
import { useSetStatsConsent } from '@/hooks/api/statsConsent/useSetStatsConsent';
import { StringInput, BooleanInput } from '../components/SettingsInputs';

const StatsConsentSetting = () => {
    const { t } = useTranslation('settings');
    const { data: statsConsent } = useStatsConsent();
    const setStatsConsent = useSetStatsConsent();

    return (
        <BooleanInput
            label={t('usage_statistics_label')}
            checked={statsConsent === 'granted'}
            onChange={(checked) => setStatsConsent.mutate(checked)}
        />
    );
};

export const GeneralTab = ({
    config,
    saveConfig,
}: {
    config: AppConfig;
    saveConfig: (updater: (prev: AppConfig) => AppConfig) => void;
}) => {
    const { t } = useTranslation('settings');

    return (
        <div className="max-w-200">
            <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                {t('category_general')}
            </h1>
            <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                {t('seer_integration')}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">{t('seer_description')}</p>
            <StringInput
                label={t('seer_url_label')}
                value={config.seerUrl || ''}
                onChange={(value) => saveConfig((prev) => ({ ...prev, seerUrl: value }))}
                placeholder={t('seer_url_placeholder')}
            />
            <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                Streamystats
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">{t('streamystats_description')}</p>
            <StringInput
                label={t('streamystats_url_label')}
                value={config.streamystatsUrl || ''}
                onChange={(value) => saveConfig((prev) => ({ ...prev, streamystatsUrl: value }))}
                placeholder={t('streamystats_url_placeholder')}
            />
            <BooleanInput
                label={t('show_streamystats_button_label')}
                checked={config.showStreamystatsButton || false}
                onChange={(checked) =>
                    saveConfig((prev) => ({
                        ...prev,
                        showStreamystatsButton: checked,
                    }))
                }
            />
            <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                {t('watched_state_badges')}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">
                {t('watched_state_badges_description')}
            </p>
            <BooleanInput
                label={t('watched_state_badge_homescreen_label')}
                checked={config.watchedStateBadgeHomeScreen || false}
                onChange={(checked) =>
                    saveConfig((prev) => ({
                        ...prev,
                        watchedStateBadgeHomeScreen: checked,
                    }))
                }
            />
            <BooleanInput
                label={t('watched_state_badge_library_label')}
                checked={config.watchedStateBadgeLibrary || false}
                onChange={(checked) =>
                    saveConfig((prev) => ({
                        ...prev,
                        watchedStateBadgeLibrary: checked,
                    }))
                }
            />
            <BooleanInput
                label={t('watched_state_badge_genre_label')}
                checked={config.watchedStateBadgeGenre || false}
                onChange={(checked) =>
                    saveConfig((prev) => ({
                        ...prev,
                        watchedStateBadgeGenre: checked,
                    }))
                }
            />
            <BooleanInput
                label={t('watched_state_badge_search_label')}
                checked={config.watchedStateBadgeSearch || false}
                onChange={(checked) =>
                    saveConfig((prev) => ({
                        ...prev,
                        watchedStateBadgeSearch: checked,
                    }))
                }
            />
            <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                {t('login_page')}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">{t('login_page_description')}</p>
            <BooleanInput
                label={t('hide_back_to_server_button_label')}
                checked={config.hideBackToServerButton || false}
                onChange={(checked) =>
                    saveConfig((prev) => ({
                        ...prev,
                        hideBackToServerButton: checked,
                    }))
                }
            />
            <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                {t('usage_statistics')}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">
                {t('usage_statistics_description')}
            </p>
            <StatsConsentSetting />
        </div>
    );
};
