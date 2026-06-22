import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import Page from '../Page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutoSaveConfig } from './useAutoSaveConfig';
import { SettingsSkeleton } from './components/SettingsSkeleton';
import { GeneralTab } from './tabs/GeneralTab';
import { HomeSectionsTab } from './tabs/HomeSectionsTab';
import { ItemPageTab } from './tabs/ItemPageTab';
import { BrandingTab } from './tabs/BrandingTab';
import { ThemesTab } from './tabs/ThemesTab';
import { LinksTab } from './tabs/LinksTab';

const SettingsPage = () => {
    const { t } = useTranslation('settings');
    const { config, loading, error, saveConfig } = useAutoSaveConfig();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';

    if (loading) {
        return (
            <Page title={t('title')} requiresAuth>
                <SettingsSkeleton />
            </Page>
        );
    }

    if (error || !config) {
        return (
            <Page title={t('title')} requiresAuth>
                Error loading settings.
            </Page>
        );
    }

    return (
        <Page title={t('title')} className="flex-1 flex flex-col" requireAdmin requiresAuth>
            <Tabs defaultValue={activeTab} onValueChange={(val) => setSearchParams({ tab: val })}>
                <TabsList>
                    <TabsTrigger value="general">{t('category_general')}</TabsTrigger>
                    <TabsTrigger value="homesections">{t('category_homesections')}</TabsTrigger>
                    <TabsTrigger value="itempage">{t('category_itempage')}</TabsTrigger>
                    <TabsTrigger value="branding">{t('category_branding')}</TabsTrigger>
                    <TabsTrigger value="themes">{t('category_themes')}</TabsTrigger>
                    <TabsTrigger value="links">{t('category_links')}</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <GeneralTab config={config} saveConfig={saveConfig} />
                </TabsContent>
                <TabsContent value="homesections">
                    <HomeSectionsTab config={config} saveConfig={saveConfig} />
                </TabsContent>
                <TabsContent value="itempage">
                    <ItemPageTab config={config} saveConfig={saveConfig} />
                </TabsContent>
                <TabsContent value="branding">
                    <BrandingTab config={config} saveConfig={saveConfig} />
                </TabsContent>
                <TabsContent value="themes">
                    <ThemesTab config={config} saveConfig={saveConfig} />
                </TabsContent>
                <TabsContent value="links">
                    <LinksTab config={config} saveConfig={saveConfig} />
                </TabsContent>
            </Tabs>
        </Page>
    );
};

export default SettingsPage;
