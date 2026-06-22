/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import type { Option } from '@/components/ui/multi-select';
import {
    CONTINUE_WATCHING_DETAIL_LINES,
    DETAIL_FIELDS,
    MEDIABAR_SIZES,
    type ContinueWatchingDetailLine,
    type DetailField,
    type HomeScreenSection,
    type RecentlyAddedSection,
} from '@/hooks/api/useConfig';
import { useUserViews } from '@/hooks/api/useUserViews';
import { StringInput, BooleanInput, SelectInput, MultiSelectInput } from './SettingsInputs';
import { ItemsConfigEditor } from './ItemsConfigEditor';

const HOMESCREEN_SECTION_TYPES = [
    { value: 'mediaBar', label: 'Media Bar' },
    { value: 'continueWatching', label: 'Continue Watching' },
    { value: 'nextUp', label: 'Next Up' },
    { value: 'resume', label: 'Resume' },
    { value: 'items', label: 'Items' },
    { value: 'recentlyAdded', label: 'Recently Added' },
    { value: 'streamystatsRecommended', label: 'Recommended' },
    { value: 'genres', label: 'Genres' },
    { value: 'libraries', label: 'Libraries' },
    { value: 'studios', label: 'Studios' },
];

const RecentlyAddedConfigEditor = ({
    section,
    onChange,
}: {
    section: RecentlyAddedSection;
    onChange: (section: RecentlyAddedSection) => void;
}) => {
    const { t } = useTranslation('settings');
    const { data: userViews } = useUserViews();

    const libraryOptions: Option[] = (userViews?.Items || [])
        .filter((v) => v.Id && v.Name)
        .map((v) => ({ value: v.Id!, label: v.Name! }));

    return (
        <div className="mt-6 space-y-4">
            <MultiSelectInput
                label={t('recently_added_libraries')}
                options={libraryOptions}
                selected={section.libraryIds || []}
                onChange={(selected) => onChange({ ...section, libraryIds: selected })}
                description={t('recently_added_libraries_description')}
            />
            <StringInput
                label={t('section_limit_label')}
                value={String(section.limit || '')}
                onChange={(value) =>
                    onChange({ ...section, limit: value ? parseInt(value) : undefined })
                }
                placeholder={t('section_limit_placeholder')}
            />
        </div>
    );
};

export const SectionEditor = ({
    section,
    onSave,
    onClose,
}: {
    section: HomeScreenSection | null;
    onSave: (section: HomeScreenSection) => void;
    onClose: () => void;
}) => {
    const { t } = useTranslation('settings');
    const [editedSection, setEditedSection] = useState<HomeScreenSection | null>(section);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditedSection(section);
    }, [section]);

    if (!editedSection) return null;

    return (
        <Dialog open={!!section} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('edit_section')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <StringInput
                        label={t('section_title_label')}
                        value={editedSection.title || ''}
                        onChange={(value) =>
                            setEditedSection({
                                ...editedSection,
                                title: value,
                            })
                        }
                        placeholder={t('section_title_placeholder')}
                    />
                    <SelectInput
                        label={t('section_type_label')}
                        options={HOMESCREEN_SECTION_TYPES}
                        value={editedSection.type}
                        onChange={(value) => {
                            setEditedSection({
                                ...editedSection,
                                type: value as HomeScreenSection['type'],
                            });
                        }}
                    />

                    {editedSection.type !== 'recentlyAdded' &&
                        editedSection.type !== 'mediaBar' &&
                        editedSection.type !== 'items' &&
                        editedSection.type !== 'libraries' && (
                            <StringInput
                                label={t('section_limit_label')}
                                value={
                                    'limit' in editedSection
                                        ? String(editedSection.limit || '')
                                        : ''
                                }
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        limit: value ? parseInt(value) : undefined,
                                    } as any)
                                }
                                placeholder={t('section_limit_placeholder')}
                            />
                        )}

                    {editedSection.type === 'recentlyAdded' && (
                        <RecentlyAddedConfigEditor
                            section={editedSection}
                            onChange={setEditedSection}
                        />
                    )}

                    {editedSection.type === 'mediaBar' && (
                        <>
                            <SelectInput
                                label={t('size')}
                                options={MEDIABAR_SIZES.map((size) => ({
                                    value: size,
                                    label: t(size),
                                }))}
                                value={(editedSection as any).size || 'medium'}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        size: value as any,
                                    })
                                }
                            />
                            <BooleanInput
                                label={t('show_favorite_button')}
                                checked={(editedSection as any).showFavoriteButton || false}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        showFavoriteButton: value,
                                    })
                                }
                            />
                            <BooleanInput
                                label={t('show_watchlist_button')}
                                checked={(editedSection as any).showWatchlistButton || false}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        showWatchlistButton: value,
                                    })
                                }
                            />
                        </>
                    )}

                    {editedSection.type === 'mediaBar' && (
                        <ItemsConfigEditor
                            items={(editedSection as any).items}
                            onChange={(newItems) =>
                                setEditedSection({
                                    ...editedSection,
                                    items: newItems,
                                })
                            }
                        />
                    )}

                    {(editedSection.type === 'continueWatching' ||
                        editedSection.type === 'nextUp' ||
                        editedSection.type === 'resume') && (
                        <>
                            <SelectInput
                                label={t('title_line')}
                                options={[
                                    { value: 'ItemTitle', label: 'Item Title' },
                                    { value: 'ParentTitle', label: 'Parent Title' },
                                    {
                                        value: 'ItemTitleWithEpisodeInfo',
                                        label: 'Item Title with Episode Info',
                                    },
                                ]}
                                value={(editedSection as any).titleLine || 'ItemTitle'}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        titleLine: value as any,
                                    })
                                }
                            />
                            <MultiSelectInput
                                label={t('detail_line')}
                                options={CONTINUE_WATCHING_DETAIL_LINES.map((l) => ({
                                    value: l,
                                    label: l,
                                }))}
                                selected={((editedSection as any).detailLine || []) as string[]}
                                onChange={(selected) =>
                                    setEditedSection({
                                        ...editedSection,
                                        detailLine: selected as ContinueWatchingDetailLine[],
                                    } as any)
                                }
                            />
                        </>
                    )}

                    {editedSection.type === 'continueWatching' && (
                        <BooleanInput
                            label={t('accurate_sorting')}
                            checked={(editedSection as any).accurateSorting || false}
                            onChange={(value) =>
                                setEditedSection({
                                    ...editedSection,
                                    accurateSorting: value,
                                })
                            }
                        />
                    )}

                    {editedSection.type === 'streamystatsRecommended' && (
                        <>
                            <SelectInput
                                label={t('recommendation_type')}
                                options={[
                                    { value: 'all', label: t('recomm_all') },
                                    { value: 'Movie', label: t('recomm_movies') },
                                    { value: 'Series', label: t('recomm_series') },
                                ]}
                                value={(editedSection as any).recommendationType || 'all'}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        recommendationType: value as any,
                                    })
                                }
                            />
                            <BooleanInput
                                label={t('show_similarity')}
                                checked={(editedSection as any).showSimilarity || false}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        showSimilarity: value,
                                    })
                                }
                            />
                            <BooleanInput
                                label={t('show_based_on')}
                                checked={(editedSection as any).showBasedOn || false}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        showBasedOn: value,
                                    })
                                }
                            />
                        </>
                    )}

                    {editedSection.type === 'items' && (
                        <>
                            <ItemsConfigEditor
                                items={(editedSection as any).items}
                                onChange={(newItems) =>
                                    setEditedSection({
                                        ...editedSection,
                                        items: newItems,
                                    })
                                }
                            />
                            <MultiSelectInput
                                label={t('detail_fields')}
                                options={DETAIL_FIELDS.map((f) => ({ value: f, label: f }))}
                                selected={((editedSection as any).detailFields || []) as string[]}
                                onChange={(selected) =>
                                    setEditedSection({
                                        ...editedSection,
                                        detailFields: selected as DetailField[],
                                    } as any)
                                }
                            />
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={() => {
                            onSave(editedSection);
                            onClose();
                        }}
                    >
                        {t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
