import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { AppConfig } from '@/hooks/api/useConfig';
import { getServerUrl } from '@/utils/localstorageCredentials';
import { getAuthorizationHeader } from '@/api/getApi';
import FileDropInput from '@/components/FileDropInput';
import { StringInput, BooleanInput } from '../components/SettingsInputs';

export const BrandingTab = ({
    config,
    saveConfig,
}: {
    config: AppConfig;
    saveConfig: (updater: (prev: AppConfig) => AppConfig) => void;
}) => {
    const { t } = useTranslation('settings');
    const [logoLightFile, setLogoLightFile] = useState<File | null>(null);
    const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);

    const handleBrandingLogoUpload = async (mode: 'light' | 'dark', file: File) => {
        const formData = new FormData();
        formData.append('logo', file);

        const jellyfinUrl = getServerUrl() || '';
        const response = await fetch(
            `/api/branding/logo/${mode}?jellyfin_url=${encodeURIComponent(jellyfinUrl)}`,
            {
                method: 'POST',
                headers: {
                    Authorization: getAuthorizationHeader(),
                },
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to upload ${mode} logo`);
        }

        const payload = (await response.json()) as { url?: string };
        const uploadedUrl = payload.url ? `${payload.url}?v=${Date.now()}` : '';

        const key = mode === 'light' ? 'logoLightUrl' : 'logoDarkUrl';
        saveConfig((prev) => ({ ...prev, [key]: uploadedUrl }));
    };

    const handleResetBrandingLogo = async (mode: 'light' | 'dark') => {
        const jellyfinUrl = getServerUrl() || '';
        const response = await fetch(
            `/api/branding/logo/${mode}?jellyfin_url=${encodeURIComponent(jellyfinUrl)}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: getAuthorizationHeader(),
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to reset ${mode} logo`);
        }

        const key = mode === 'light' ? 'logoLightUrl' : 'logoDarkUrl';
        saveConfig((prev) => ({ ...prev, [key]: '' }));

        if (mode === 'light') setLogoLightFile(null);
        else setLogoDarkFile(null);
    };

    return (
        <div className="max-w-200">
            <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                {t('category_branding')}
            </h1>
            <StringInput
                label={t('server_name_label')}
                value={config.serverName || ''}
                onChange={(value) => saveConfig((prev) => ({ ...prev, serverName: value }))}
                placeholder={t('server_name_placeholder')}
                description={t('server_name_description')}
            />
            <BooleanInput
                label={t('show_logo_in_top_bar_label')}
                checked={config.showLogoInTopBar !== false}
                onChange={(checked) =>
                    saveConfig((prev) => ({ ...prev, showLogoInTopBar: checked }))
                }
            />
            <StringInput
                label={t('logo_light_url_label')}
                value={config.logoLightUrl || ''}
                onChange={(value) => saveConfig((prev) => ({ ...prev, logoLightUrl: value }))}
                placeholder={t('logo_url_placeholder')}
                description={t('logo_light_url_description')}
            />
            <div className="mt-3">
                <Label className="mb-2 block">{t('upload_light_logo_label')}</Label>
                <FileDropInput
                    accept="image/*"
                    value={logoLightFile}
                    onChange={(file) => {
                        setLogoLightFile(file);
                        if (!file) return;

                        void (async () => {
                            try {
                                await handleBrandingLogoUpload('light', file);
                                toast.success(t('logo_upload_success'));
                            } catch (uploadError) {
                                console.error('Error uploading light logo:', uploadError);
                                toast.error(t('logo_upload_error'));
                            } finally {
                                setLogoLightFile(null);
                            }
                        })();
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                        try {
                            await handleResetBrandingLogo('light');
                            toast.success(t('logo_reset_success'));
                        } catch (resetError) {
                            console.error('Error resetting light logo:', resetError);
                            toast.error(t('logo_reset_error'));
                        }
                    }}
                >
                    <RotateCcw />
                    {t('reset_light_logo_label')}
                </Button>
            </div>
            <StringInput
                label={t('logo_dark_url_label')}
                value={config.logoDarkUrl || ''}
                onChange={(value) => saveConfig((prev) => ({ ...prev, logoDarkUrl: value }))}
                placeholder={t('logo_url_placeholder')}
                description={t('logo_dark_url_description')}
            />
            <div className="mt-3">
                <Label className="mb-2 block">{t('upload_dark_logo_label')}</Label>
                <FileDropInput
                    accept="image/*"
                    value={logoDarkFile}
                    onChange={(file) => {
                        setLogoDarkFile(file);
                        if (!file) return;

                        void (async () => {
                            try {
                                await handleBrandingLogoUpload('dark', file);
                                toast.success(t('logo_upload_success'));
                            } catch (uploadError) {
                                console.error('Error uploading dark logo:', uploadError);
                                toast.error(t('logo_upload_error'));
                            } finally {
                                setLogoDarkFile(null);
                            }
                        })();
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                        try {
                            await handleResetBrandingLogo('dark');
                            toast.success(t('logo_reset_success'));
                        } catch (resetError) {
                            console.error('Error resetting dark logo:', resetError);
                            toast.error(t('logo_reset_error'));
                        }
                    }}
                >
                    <RotateCcw />
                    {t('reset_dark_logo_label')}
                </Button>
            </div>
        </div>
    );
};
