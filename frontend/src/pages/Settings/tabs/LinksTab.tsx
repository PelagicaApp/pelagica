import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { AppConfig, ConfigLink } from '@/hooks/api/useConfig';
import { LinkRow } from '../components/LinkRow';

export const LinksTab = ({
    config,
    saveConfig,
}: {
    config: AppConfig;
    saveConfig: (updater: (prev: AppConfig) => AppConfig) => void;
}) => {
    const { t } = useTranslation('settings');
    const links = config.links || [];

    const updateLinks = (newLinks: ConfigLink[]) => {
        saveConfig((prev) => ({ ...prev, links: newLinks }));
    };

    const moveLink = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= links.length) return;
        const updated = [...links];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        updateLinks(updated);
    };

    return (
        <div className="max-w-200">
            <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                {t('category_links')}
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">{t('links_description')}</p>

            <div className="space-y-3">
                {links.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('no_links_configured')}</p>
                ) : (
                    links.map((link, index) => (
                        <LinkRow
                            key={index}
                            link={link}
                            onChange={(updated) => {
                                const next = [...links];
                                next[index] = updated;
                                saveConfig((prev) => ({ ...prev, links: next }));
                            }}
                            onDelete={() => updateLinks(links.filter((_, i) => i !== index))}
                            onMoveUp={() => moveLink(index, -1)}
                            onMoveDown={() => moveLink(index, 1)}
                            canMoveUp={index > 0}
                            canMoveDown={index < links.length - 1}
                        />
                    ))
                )}
            </div>

            <Button
                onClick={() => updateLinks([...links, { url: '', text: '', icon: '' }])}
                className="mt-4"
                variant="outline"
            >
                <Plus />
                {t('add_link')}
            </Button>
        </div>
    );
};
