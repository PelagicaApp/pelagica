import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Plus, Earth } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { AppConfig } from '@/hooks/api/useConfig';
import { useThemes } from '@/hooks/api/themes/useThemes';
import { useDeleteTheme } from '@/hooks/api/themes/useDeleteTheme';
import { useCreateTheme } from '@/hooks/api/themes/useCreateTheme';
import JsonFileUpload from '@/components/JsonFileUpload';
import { SelectInput } from '../components/SettingsInputs';
import { SettingsSkeleton } from '../components/SettingsSkeleton';

export const ThemesTab = ({
    config,
    saveConfig,
}: {
    config: AppConfig;
    saveConfig: (updater: (prev: AppConfig) => AppConfig) => void;
}) => {
    const { t } = useTranslation('settings');
    const { data: themes, isLoading: themesLoading } = useThemes();
    const { mutate: deleteTheme, isPending: isDeletingTheme } = useDeleteTheme();
    const { mutate: createTheme, isPending: isCreatingTheme } = useCreateTheme();
    const [showThemeUploadDialog, setShowThemeUploadDialog] = useState(false);

    const themeSelectOptions = (themes || [])
        .map((theme) => ({
            value: theme.id,
            label: `${theme.name} v${theme.version} (by ${theme.author})`,
        }))
        .concat([{ value: '__DEFAULT__', label: t('default_theme') }])
        .sort((a, b) => {
            if (a.value === '__DEFAULT__') return -1;
            if (b.value === '__DEFAULT__') return 1;
            return a.label.localeCompare(b.label);
        });

    return (
        <div className="max-w-200">
            <Dialog
                open={showThemeUploadDialog}
                onOpenChange={() => setShowThemeUploadDialog(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('upload_new_theme')}</DialogTitle>
                    </DialogHeader>
                    <JsonFileUpload
                        onChange={(json) => {
                            if (!json) return;
                            try {
                                const theme = JSON.parse(json);
                                createTheme(theme, {
                                    onSuccess: () => {
                                        setShowThemeUploadDialog(false);
                                        toast.success(t('theme_upload_success'));
                                    },
                                    onError: (e) => {
                                        console.error('Error creating theme:', e);
                                        toast.error(t('theme_upload_error'));
                                    },
                                });
                            } catch (e) {
                                console.error('Invalid JSON:', e);
                                toast.error(t('theme_invalid_json'));
                            }
                        }}
                        disabled={isCreatingTheme}
                    />
                </DialogContent>
            </Dialog>

            <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                {t('category_themes')}
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">{t('themes_description')}</p>

            <SelectInput
                label={t('theme_selection_label')}
                options={themeSelectOptions}
                value={config.serverThemeId || ''}
                onChange={(value) =>
                    saveConfig((prev) => ({
                        ...prev,
                        serverThemeId: value === '__DEFAULT__' ? undefined : value,
                    }))
                }
                placeholder={t('select_theme_default')}
            />

            <div className="flex items-center gap-3 mt-6">
                <Button onClick={() => setShowThemeUploadDialog(true)} variant="outline">
                    <Plus />
                    {t('upload_new_theme')}
                </Button>
                <Button variant="outline" asChild>
                    <Link to="/browse-themes">
                        <Earth />
                        {t('browse_themes')}
                    </Link>
                </Button>
            </div>

            {themesLoading ? (
                <SettingsSkeleton />
            ) : themes && themes.length > 0 ? (
                <div className="space-y-3 mt-4">
                    {themes.map((theme) => (
                        <div
                            key={theme.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                        >
                            <div className="flex flex-col">
                                <span className="font-semibold">{theme.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    v{theme.version} by {theme.author}
                                </span>
                            </div>
                            <div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => deleteTheme(theme.id)}
                                    disabled={isDeletingTheme}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground mt-4">{t('no_themes_installed')}</p>
            )}
        </div>
    );
};
