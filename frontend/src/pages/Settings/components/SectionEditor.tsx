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
    SEERR_DISCOVER_VARIANTS,
    SEERR_VARIANT_SLIDER_TYPES,
    type ContinueWatchingDetailLine,
    type ContinueWatchingTitleLine,
    type DetailField,
    type HomeScreenSection,
    type RecentlyAddedSection,
    type RecentEpisodesSection,
    type SeerrDiscoverSection,
    type SeerrDiscoverVariant,
    useSeerrDiscoverSliders,
    useSeerrLoginStatus,
} from '@pelagica/core';
import { useUserViews } from '@pelagica/core';
import {
    ImmediateStringInput,
    BooleanInput,
    SelectInput,
    MultiSelectInput,
} from './SettingsInputs';
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
    { value: 'recentEpisodes', label: 'Recent Episodes' },
    { value: 'seerrDiscover', label: 'Seerr Discover' },
];

const SLIDER_VALUE_PREFIX = 'slider:';

const SeerrDiscoverPicker = ({
    section,
    onChange,
}: {
    section: SeerrDiscoverSection;
    onChange: (section: SeerrDiscoverSection) => void;
}) => {
    const { t } = useTranslation('settings');
    const { data: isLoggedIn } = useSeerrLoginStatus();
    const { data: sliders } = useSeerrDiscoverSliders(!!isLoggedIn);

    const builtinOptions = SEERR_DISCOVER_VARIANTS.map((variant) => ({
        value: variant,
        label: t(`seerr_variant_${variant}`),
    }));

    const customOptions = (sliders || [])
        .filter((slider) => !SEERR_VARIANT_SLIDER_TYPES.includes(slider.type))
        .map((slider) => ({
            value: `${SLIDER_VALUE_PREFIX}${slider.id}`,
            label: slider.title,
        }));

    const selectedValue =
        section.sliderId != null
            ? `${SLIDER_VALUE_PREFIX}${section.sliderId}`
            : section.variant || 'trending';

    if (
        section.sliderId != null &&
        !customOptions.some((option) => option.value === selectedValue)
    ) {
        customOptions.push({
            value: selectedValue,
            label: section.title || `Slider ${section.sliderId}`,
        });
    }

    return (
        <SelectInput
            label={t('seerr_discover_variant')}
            description={t('seerr_discover_slider_description')}
            options={[...builtinOptions, ...customOptions]}
            value={selectedValue}
            onChange={(value) => {
                if (value.startsWith(SLIDER_VALUE_PREFIX)) {
                    const sliderId = Number(value.slice(SLIDER_VALUE_PREFIX.length));
                    const slider = sliders?.find((item) => item.id === sliderId);
                    onChange({
                        ...section,
                        sliderId,
                        variant: undefined,
                        title: slider?.title || section.title,
                    });
                    return;
                }
                onChange({
                    ...section,
                    sliderId: undefined,
                    variant: value as SeerrDiscoverVariant,
                });
            }}
        />
    );
};

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
            <ImmediateStringInput
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

const RecentEpisodesConfigEditor = ({
    section,
    onChange,
}: {
    section: RecentEpisodesSection;
    onChange: (section: RecentEpisodesSection) => void;
}) => {
    const { t } = useTranslation('settings');
    const { data: userViews } = useUserViews();

    const libraryOptions: Option[] = (userViews?.Items || [])
        .filter((v) => v.Id && v.Name && v.CollectionType === 'tvshows')
        .map((v) => ({ value: v.Id!, label: v.Name! }));

    return (
        <div className="mt-6 space-y-4">
            <SelectInput
                label={t('recent_episodes_library_label')}
                options={libraryOptions}
                value={section.libraryId || ''}
                onChange={(value) => onChange({ ...section, libraryId: value })}
                description={t('recent_episodes_library_description')}
            />
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
                value={section.titleLine || 'ItemTitle'}
                onChange={(value) =>
                    onChange({ ...section, titleLine: value as ContinueWatchingTitleLine })
                }
            />
            <MultiSelectInput
                label={t('detail_line')}
                options={CONTINUE_WATCHING_DETAIL_LINES.map((l) => ({
                    value: l,
                    label: l,
                }))}
                selected={section.detailLine || []}
                onChange={(selected) =>
                    onChange({
                        ...section,
                        detailLine: selected as ContinueWatchingDetailLine[],
                    })
                }
            />
            <ImmediateStringInput
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
        <Dialog
            open={!!section}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('edit_section')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <ImmediateStringInput
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
                                type: value,
                            } as HomeScreenSection);
                        }}
                    />

                    {editedSection.type !== 'recentlyAdded' &&
                        editedSection.type !== 'mediaBar' &&
                        editedSection.type !== 'items' &&
                        editedSection.type !== 'libraries' &&
                        editedSection.type !== 'recentEpisodes' &&
                        editedSection.type !== 'seerrDiscover' && (
                            <ImmediateStringInput
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

                    {editedSection.type === 'recentEpisodes' && (
                        <RecentEpisodesConfigEditor
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
                            <BooleanInput
                                label={t('autoplay_trailers')}
                                checked={(editedSection as any).autoPlayTrailers || false}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        autoPlayTrailers: value,
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
                            <BooleanInput
                                label={t('use_thumb_image')}
                                checked={(editedSection as any).useThumbImage || false}
                                onChange={(value) =>
                                    setEditedSection({
                                        ...editedSection,
                                        useThumbImage: value,
                                        autoPlayTrailers: value
                                            ? (editedSection as any).autoPlayTrailers
                                            : false,
                                    })
                                }
                            />
                            {(editedSection as any).useThumbImage && (
                                <BooleanInput
                                    label={t('autoplay_trailers')}
                                    checked={(editedSection as any).autoPlayTrailers || false}
                                    onChange={(value) =>
                                        setEditedSection({
                                            ...editedSection,
                                            autoPlayTrailers: value,
                                        })
                                    }
                                />
                            )}
                        </>
                    )}

                    {editedSection.type === 'seerrDiscover' && (
                        <SeerrDiscoverPicker
                            section={editedSection}
                            onChange={(section) => setEditedSection(section)}
                        />
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
