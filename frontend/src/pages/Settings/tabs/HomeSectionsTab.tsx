import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Edit, GripVertical } from 'lucide-react';
import { randomUUID, type AppConfig, type HomeScreenSection } from '@pelagica/core';
import { SectionEditor } from '../components/SectionEditor';
import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const generateSectionId = () => randomUUID();

const SortableSectionRow = ({
    id,
    section,
    onToggleEnabled,
    onEdit,
    onDelete,
}: {
    id: string;
    section: HomeScreenSection;
    onToggleEnabled: (checked: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const { t } = useTranslation('settings');
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 bg-background ${
                isDragging ? 'opacity-50' : ''
            }`}
        >
            <div className="flex items-center flex-1 gap-2">
                <button
                    type="button"
                    className="self-stretch cursor-grab active:cursor-grabbing text-muted-foreground touch-none mr-1"
                    aria-label={t('reorder_section')}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <div className="flex flex-col">
                    <span className="font-semibold">
                        {section.title || t(`section_type_${section.type}`) || section.type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {t(`section_type_${section.type}`)}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <Switch
                    checked={section.enabled !== false}
                    onCheckedChange={onToggleEnabled}
                    className="mr-2"
                />
                <Button onClick={onEdit} variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    onClick={onDelete}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

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

    // since sections don't have an id, generate one so dndkit can track them
    const [sectionIds, setSectionIds] = useState<string[]>(() => sections.map(generateSectionId));
    if (sectionIds.length !== sections.length) {
        setSectionIds(sections.map(generateSectionId));
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const updateSections = (newSections: HomeScreenSection[]) => {
        saveConfig((prev) => ({ ...prev, homeScreenSections: newSections }));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sectionIds.indexOf(active.id as string);
        const newIndex = sectionIds.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;
        updateSections(arrayMove(sections, oldIndex, newIndex));
        setSectionIds(arrayMove(sectionIds, oldIndex, newIndex));
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                            {sections.map((section, index) => (
                                <SortableSectionRow
                                    key={sectionIds[index]}
                                    id={sectionIds[index]}
                                    section={section}
                                    onToggleEnabled={(checked) => {
                                        const updated = [...sections];
                                        updated[index] = { ...updated[index], enabled: checked };
                                        updateSections(updated);
                                    }}
                                    onEdit={() => setEditingIndex(index)}
                                    onDelete={() => {
                                        updateSections(sections.filter((_, i) => i !== index));
                                        setSectionIds(sectionIds.filter((_, i) => i !== index));
                                    }}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
            <button
                onClick={() => {
                    updateSections([
                        ...sections,
                        { type: 'items', title: 'New Section', enabled: true },
                    ]);
                    setSectionIds([...sectionIds, generateSectionId()]);
                }}
                className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-muted/10 cursor-pointer border-dashed border-2 w-full rounded-lg px-7 py-5"
            >
                <Plus />
                {t('add_section')}
            </button>
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
