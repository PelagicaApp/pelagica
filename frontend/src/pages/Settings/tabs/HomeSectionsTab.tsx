import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Edit, ArrowUp, ArrowDown } from 'lucide-react';
import type { AppConfig, HomeScreenSection } from '@/hooks/api/useConfig';
import { SectionEditor } from '../components/SectionEditor';

export const HomeSectionsTab = ({
    config,
    saveConfig,
}: {
    config: AppConfig;
    saveConfig: (updater: (prev: AppConfig) => AppConfig) => void;
}) => {
    const { t } = useTranslation('settings');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const sections = config.homeScreenSections || [];

    const updateSections = (newSections: HomeScreenSection[]) => {
        saveConfig((prev) => ({ ...prev, homeScreenSections: newSections }));
    };

    const moveSection = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= sections.length) return;
        const updated = [...sections];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        updateSections(updated);
    };

    return (
        <div className="max-w-200">
            <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                {t('category_homesections')}
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">{t('homesections_description')}</p>
            <div className="mt-4 space-y-3">
                {sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('no_sections_configured')}</p>
                ) : (
                    sections.map((section, index) => (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4"
                        >
                            <div className="flex flex-col flex-1">
                                <span className="font-semibold">
                                    {section.title ||
                                        t(`section_type_${section.type}`) ||
                                        section.type}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {t(`section_type_${section.type}`)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <Button
                                    onClick={() => moveSection(index, -1)}
                                    variant="ghost"
                                    size="sm"
                                    disabled={index === 0}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() => moveSection(index, 1)}
                                    variant="ghost"
                                    size="sm"
                                    disabled={index === sections.length - 1}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Switch
                                    checked={section.enabled !== false}
                                    onCheckedChange={(checked) => {
                                        const updated = [...sections];
                                        updated[index] = { ...updated[index], enabled: checked };
                                        updateSections(updated);
                                    }}
                                    className="mr-2"
                                />
                                <Button
                                    onClick={() => setEditingIndex(index)}
                                    variant="ghost"
                                    size="sm"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() =>
                                        updateSections(sections.filter((_, i) => i !== index))
                                    }
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Button
                onClick={() =>
                    updateSections([
                        ...sections,
                        { type: 'items', title: 'New Section', enabled: true },
                    ])
                }
                className="mt-4"
                variant="outline"
            >
                <Plus />
                {t('add_section')}
            </Button>
            <SectionEditor
                section={editingIndex !== null ? sections[editingIndex] : null}
                onSave={(editedSection) => {
                    if (editingIndex !== null) {
                        const updated = [...sections];
                        updated[editingIndex] = editedSection;
                        updateSections(updated);
                        setEditingIndex(null);
                    }
                }}
                onClose={() => setEditingIndex(null)}
            />
        </div>
    );
};
