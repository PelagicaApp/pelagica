/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from 'react-i18next';
import Page from '../Page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DETAIL_BADGES,
    EPISODE_DISPLAYS,
    DETAIL_FIELDS,
    useConfig,
    useUpdateConfig,
    type DetailBadge,
    type DetailField,
    type HomeScreenSection,
    type SectionItemsConfig,
    type ConfigLink,
} from '@/hooks/api/useConfig';
import { useState, useEffect, memo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Check,
    Trash2,
    Plus,
    Edit,
    ArrowUp,
    ArrowDown,
    Earth,
    Link2,
    RotateCcw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { useThemes } from '@/hooks/api/themes/useThemes';
import { useDeleteTheme } from '@/hooks/api/themes/useDeleteTheme';
import JsonFileUpload from '@/components/JsonFileUpload';
import { useCreateTheme } from '@/hooks/api/themes/useCreateTheme';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { IconPicker, type IconName } from '../../components/ui/icon-picker';
import { DynamicIcon } from 'lucide-react/dynamic';
import { getAccessToken, getServerUrl } from '@/utils/localstorageCredentials';
import FileDropInput from '@/components/FileDropInput';
import { useStatsConsent } from '../../hooks/api/statsConsent/useStatsConsent';
import { useSetStatsConsent } from '../../hooks/api/statsConsent/useSetStatsConsent';

const StringInput = ({
    label,
    value,
    onChange,
    placeholder,
    description,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    description?: string;
}) => (
    <div className="mt-4">
        <Label htmlFor={label} className="mb-2">
            {label}
        </Label>
        {description && <p className="mb-2 text-sm text-muted-foreground">{description}</p>}
        <Input
            id={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

const BooleanInput = ({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) => (
    <div className="mt-4 flex items-center gap-3">
        <Switch id={label} checked={checked} onCheckedChange={onChange} />
        <Label htmlFor={label}>{label}</Label>
    </div>
);

const SelectInput = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    description,
}: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    description?: string;
}) => (
    <div className="mt-4">
        <Label htmlFor={label} className="mb-2">
            {label}
        </Label>
        {description && <p className="mb-2 text-sm text-muted-foreground">{description}</p>}
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => onChange(option.value)}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

const MultiSelectInput = ({
    label,
    options,
    selected,
    onChange,
    description,
    allowCustom,
}: {
    label: string;
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    description?: string;
    allowCustom?: boolean;
}) => (
    <div className="mt-4">
        <Label className="mb-2">{label}</Label>
        {description && <p className="mb-2 text-sm text-muted-foreground">{description}</p>}
        <MultiSelect
            options={options}
            selected={selected}
            onChange={onChange}
            allowCustom={allowCustom}
        />
    </div>
);

const SectionEditor = ({
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
                        options={[
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
                        ]}
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

                    {editedSection.type === 'mediaBar' && (
                        <>
                            <SelectInput
                                label={t('size')}
                                options={[
                                    { value: 'small', label: t('small') },
                                    { value: 'medium', label: t('medium') },
                                    { value: 'large', label: t('large') },
                                    { value: 'xlarge', label: t('xlarge') },
                                ]}
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

const SettingsSkeleton = memo(() => (
    <div className="space-y-4 max-w-200">
        <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
));

const ItemsConfigEditor = ({
    items,
    onChange,
}: {
    items: SectionItemsConfig | undefined;
    onChange: (items: SectionItemsConfig) => void;
}) => {
    const { t } = useTranslation('settings');

    const current: SectionItemsConfig = items || {};
    const sortByOptions: Option[] = [
        { value: 'DateCreated', label: 'Date Created' },
        { value: 'PremiereDate', label: 'Premiere Date' },
        { value: 'Random', label: 'Random' },
        { value: 'CommunityRating', label: 'Community Rating' },
        { value: 'ProductionYear', label: 'Production Year' },
        { value: 'Name', label: 'Name' },
        { value: 'SortName', label: 'Sort Name' },
    ];
    const typeOptions: Option[] = [
        { value: 'Movie', label: 'Movie' },
        { value: 'Series', label: 'Series' },
        { value: 'BoxSet', label: 'Box Set' },
        { value: 'MusicAlbum', label: 'Music Album' },
        { value: 'Playlist', label: 'Playlist' },
    ];

    return (
        <div className="mt-6 space-y-4">
            <MultiSelectInput
                label={t('sort_by')}
                options={sortByOptions}
                selected={(current.sortBy as string[]) || []}
                onChange={(selected) => onChange({ ...current, sortBy: selected as any })}
            />
            <SelectInput
                label={t('sort_order')}
                options={[
                    { value: 'Ascending', label: t('ascending') },
                    { value: 'Descending', label: t('descending') },
                ]}
                value={current.sortOrder || 'Descending'}
                onChange={(value) => onChange({ ...current, sortOrder: value as any })}
            />
            <MultiSelectInput
                label={t('item_types')}
                options={typeOptions}
                selected={(current.types as string[]) || []}
                onChange={(selected) => onChange({ ...current, types: selected as any })}
            />
            <StringInput
                label={t('library_id')}
                value={current.libraryId || ''}
                onChange={(value) => onChange({ ...current, libraryId: value || undefined })}
                placeholder={t('library_id_placeholder')}
                description={t('library_id_description')}
            />
            <MultiSelectInput
                label={t('genres')}
                options={(current.genres || []).map((g) => ({ value: g, label: g }))}
                selected={current.genres || []}
                onChange={(selected) => onChange({ ...current, genres: selected })}
                allowCustom
            />
            <MultiSelectInput
                label={t('tags')}
                options={(current.tags || []).map((g) => ({ value: g, label: g }))}
                selected={current.tags || []}
                onChange={(selected) => onChange({ ...current, tags: selected })}
                allowCustom
            />
            <StringInput
                label={t('items_limit')}
                value={String(current.limit || '')}
                onChange={(value) =>
                    onChange({ ...current, limit: value ? parseInt(value) : undefined })
                }
                placeholder={t('items_limit_placeholder')}
            />
            <BooleanInput
                label={t('only_favorites')}
                checked={current.isFavorite || false}
                onChange={(checked) => onChange({ ...current, isFavorite: checked })}
            />
            <BooleanInput
                label={t('only_watchlist_kefintweaks')}
                checked={current.isInKefinTweaksWatchlist || false}
                onChange={(checked) => onChange({ ...current, isInKefinTweaksWatchlist: checked })}
            />
            <BooleanInput
                label={t('only_unplayed')}
                checked={current.isUnplayed || false}
                onChange={(checked) => onChange({ ...current, isUnplayed: checked })}
            />
        </div>
    );
};

const LinkRow = ({
    link,
    onChange,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: {
    link: ConfigLink;
    onChange: (link: ConfigLink) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}) => {
    const { t } = useTranslation('settings');

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
                <IconPicker
                    value={(link.icon || undefined) as IconName | undefined}
                    onValueChange={(value) => onChange({ ...link, icon: value })}
                    searchPlaceholder={t('link_icon_search_placeholder')}
                    triggerPlaceholder={t('link_icon_placeholder')}
                    showCategoryButtons={false}
                >
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label={t('link_icon_label')}
                    >
                        {link.icon ? (
                            <DynamicIcon name={link.icon as IconName} className="h-4 w-4" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                    </Button>
                </IconPicker>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                        value={link.text}
                        onChange={(e) => onChange({ ...link, text: e.target.value })}
                        placeholder={t('link_text_placeholder')}
                    />
                    <Input
                        value={link.url}
                        onChange={(e) => onChange({ ...link, url: e.target.value })}
                        placeholder={t('link_url_placeholder')}
                    />
                </div>

                <div className="flex items-center gap-1">
                    <Button onClick={onMoveUp} variant="ghost" size="sm" disabled={!canMoveUp}>
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button onClick={onMoveDown} variant="ghost" size="sm" disabled={!canMoveDown}>
                        <ArrowDown className="h-4 w-4" />
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
        </div>
    );
};

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

const SettingsPage = () => {
    const { t } = useTranslation('settings');
    const { config, loading, error } = useConfig();
    const { updateConfig, loading: updating } = useUpdateConfig();
    const [serverAddress, setServerAddress] = useState('');
    const [streamystatsUrl, setStreamystatsUrl] = useState('');
    const [showStreamystatsButton, setShowStreamystatsButton] = useState(false);
    const [watchedStateBadgeHomeScreen, setWatchedStateBadgeHomeScreen] = useState(false);
    const [watchedStateBadgeLibrary, setWatchedStateBadgeLibrary] = useState(false);
    const [watchedStateBadgeGenre, setWatchedStateBadgeGenre] = useState(false);
    const [watchedStateBadgeSearch, setWatchedStateBadgeSearch] = useState(false);
    const [episodeDisplay, setEpisodeDisplay] = useState<'grid' | 'row'>('row');
    const [showWatchlistButton, setShowWatchlistButton] = useState(false);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const [favoriteButton, setFavoriteButton] = useState<string[]>([]);
    const [detailBadges, setDetailBadges] = useState<string[]>([]);
    const [homeScreenSections, setHomeScreenSections] = useState<HomeScreenSection[]>([]);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [serverThemeId, setServerThemeId] = useState<string | null>(null);
    const [serverName, setServerName] = useState<string>('');
    const [logoLightUrl, setLogoLightUrl] = useState<string>('');
    const [logoDarkUrl, setLogoDarkUrl] = useState<string>('');
    const [logoLightFile, setLogoLightFile] = useState<File | null>(null);
    const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
    const { data: themes, isLoading: themesLoading } = useThemes();
    const { mutate: deleteTheme, isPending: isDeletingTheme } = useDeleteTheme();
    const [showThemeUploadDialog, setShowThemeUploadDialog] = useState(false);
    const { mutate: createTheme, isPending: isCreatingTheme } = useCreateTheme();
    const [links, setLinks] = useState<ConfigLink[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';

    const moveSection = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= homeScreenSections.length) return;
        const updated = [...homeScreenSections];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        setHomeScreenSections(updated);
    };

    const moveLink = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= links.length) return;
        const updated = [...links];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        setLinks(updated);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setServerAddress(config?.serverAddress || '');
        setStreamystatsUrl(config?.streamystatsUrl || '');
        setShowStreamystatsButton(config?.showStreamystatsButton || false);
        setWatchedStateBadgeHomeScreen(config?.watchedStateBadgeHomeScreen || false);
        setWatchedStateBadgeLibrary(config?.watchedStateBadgeLibrary || false);
        setWatchedStateBadgeGenre(config?.watchedStateBadgeGenre || false);
        setWatchedStateBadgeSearch(config?.watchedStateBadgeSearch || false);
        setEpisodeDisplay(config?.itemPage?.episodeDisplay || 'row');
        setShowWatchlistButton(config?.itemPage?.showWatchlistButton || false);
        setShowDownloadButton(config?.itemPage?.showDownloadButton || false);
        setFavoriteButton(config?.itemPage?.favoriteButton || []);
        setDetailBadges(config?.itemPage?.detailBadges || []);
        setHomeScreenSections(config?.homeScreenSections || []);
        setServerThemeId(config?.serverThemeId || null);
        setServerName(config?.serverName || '');
        setLogoLightUrl(config?.logoLightUrl || '');
        setLogoDarkUrl(config?.logoDarkUrl || '');
        setLinks(config?.links || []);
    }, [
        config?.serverAddress,
        config?.streamystatsUrl,
        config?.showStreamystatsButton,
        config?.watchedStateBadgeHomeScreen,
        config?.watchedStateBadgeLibrary,
        config?.watchedStateBadgeGenre,
        config?.watchedStateBadgeSearch,
        config?.itemPage?.episodeDisplay,
        config?.itemPage?.showWatchlistButton,
        config?.itemPage?.showDownloadButton,
        config?.itemPage?.favoriteButton,
        config?.itemPage?.detailBadges,
        config?.homeScreenSections,
        config?.serverThemeId,
        config?.serverName,
        config?.logoLightUrl,
        config?.logoDarkUrl,
        config?.links,
    ]);

    const handleBrandingLogoUpload = async (mode: 'light' | 'dark', file: File) => {
        const formData = new FormData();
        formData.append('logo', file);

        const jellyfinUrl = getServerUrl() || '';
        const response = await fetch(
            `/api/branding/logo/${mode}?jellyfin_url=${encodeURIComponent(jellyfinUrl)}`,
            {
                method: 'POST',
                headers: {
                    Authorization: getAccessToken() || '',
                },
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to upload ${mode} logo`);
        }

        const payload = (await response.json()) as { url?: string };
        const uploadedUrl = payload.url ? `${payload.url}?v=${Date.now()}` : '';

        if (mode === 'light') {
            setLogoLightUrl(uploadedUrl);
        } else {
            setLogoDarkUrl(uploadedUrl);
        }
    };

    const handleResetBrandingLogo = async (mode: 'light' | 'dark') => {
        const jellyfinUrl = getServerUrl() || '';
        const response = await fetch(
            `/api/branding/logo/${mode}?jellyfin_url=${encodeURIComponent(jellyfinUrl)}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: getAccessToken() || '',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to reset ${mode} logo`);
        }

        if (mode === 'light') {
            setLogoLightUrl('');
            setLogoLightFile(null);
        } else {
            setLogoDarkUrl('');
            setLogoDarkFile(null);
        }
    };

    const handleUpdateConfig = async () => {
        // update config takes in the whole config object, so we need to merge the existing config with the updated values
        if (config) {
            try {
                await updateConfig({
                    ...config,
                    serverAddress,
                    streamystatsUrl,
                    showStreamystatsButton,
                    watchedStateBadgeHomeScreen,
                    watchedStateBadgeLibrary,
                    watchedStateBadgeGenre,
                    watchedStateBadgeSearch,
                    homeScreenSections,
                    serverName,
                    logoLightUrl,
                    logoDarkUrl,
                    serverThemeId: serverThemeId || undefined,
                    itemPage: {
                        ...config.itemPage,
                        episodeDisplay,
                        showWatchlistButton,
                        showDownloadButton,
                        favoriteButton:
                            favoriteButton.length > 0 ? (favoriteButton as BaseItemKind[]) : [],
                        detailBadges:
                            detailBadges.length > 0 ? (detailBadges as DetailBadge[]) : [],
                    },
                    links: links.map((link) => ({
                        ...link,
                    })),
                });
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
                toast.success(t('settings_saved'));
            } catch (e) {
                console.error('Error updating config:', e);
                toast.error(t('settings_save_error'));
            }
        }
    };

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

            <Tabs
                defaultValue={activeTab}
                onValueChange={(val) => {
                    setSearchParams({ tab: val });
                }}
            >
                <TabsList>
                    <TabsTrigger value="general">{t('category_general')}</TabsTrigger>
                    <TabsTrigger value="homesections">{t('category_homesections')}</TabsTrigger>
                    <TabsTrigger value="itempage">{t('category_itempage')}</TabsTrigger>
                    <TabsTrigger value="branding">{t('category_branding')}</TabsTrigger>
                    <TabsTrigger value="themes">{t('category_themes')}</TabsTrigger>
                    <TabsTrigger value="links">{t('category_links')}</TabsTrigger>
                </TabsList>
                <TabsContent value="branding" className="max-w-200">
                    <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                        {t('category_branding')}
                    </h1>
                    <StringInput
                        label={t('server_name_label')}
                        value={serverName}
                        onChange={setServerName}
                        placeholder={t('server_name_placeholder')}
                        description={t('server_name_description')}
                    />
                    <StringInput
                        label={t('logo_light_url_label')}
                        value={logoLightUrl}
                        onChange={setLogoLightUrl}
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
                        value={logoDarkUrl}
                        onChange={setLogoDarkUrl}
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
                </TabsContent>
                <TabsContent value="general" className="max-w-200">
                    <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                        {t('category_general')}
                    </h1>
                    <StringInput
                        label={t('server_address_label')}
                        value={serverAddress}
                        onChange={setServerAddress}
                        placeholder={t('server_address_placeholder')}
                        description={t('server_address_description')}
                    />
                    <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                        Streamystats
                    </h2>
                    <p className="mb-2 text-sm text-muted-foreground">
                        {t('streamystats_description')}
                    </p>
                    <StringInput
                        label={t('streamystats_url_label')}
                        value={streamystatsUrl}
                        onChange={setStreamystatsUrl}
                        placeholder={t('streamystats_url_placeholder')}
                    />
                    <BooleanInput
                        label={t('show_streamystats_button_label')}
                        checked={showStreamystatsButton}
                        onChange={setShowStreamystatsButton}
                    />
                    <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                        {t('watched_state_badges')}
                    </h2>
                    <p className="mb-2 text-sm text-muted-foreground">
                        {t('watched_state_badges_description')}
                    </p>
                    <BooleanInput
                        label={t('watched_state_badge_homescreen_label')}
                        checked={watchedStateBadgeHomeScreen}
                        onChange={setWatchedStateBadgeHomeScreen}
                    />
                    <BooleanInput
                        label={t('watched_state_badge_library_label')}
                        checked={watchedStateBadgeLibrary}
                        onChange={setWatchedStateBadgeLibrary}
                    />
                    <BooleanInput
                        label={t('watched_state_badge_genre_label')}
                        checked={watchedStateBadgeGenre}
                        onChange={setWatchedStateBadgeGenre}
                    />
                    <BooleanInput
                        label={t('watched_state_badge_search_label')}
                        checked={watchedStateBadgeSearch}
                        onChange={setWatchedStateBadgeSearch}
                    />
                    <h2 className="mt-6 mb-2 text-xl font-semibold leading-none tracking-tight">
                        {t('usage_statistics')}
                    </h2>
                    <p className="mb-2 text-sm text-muted-foreground">
                        {t('usage_statistics_description')}
                    </p>
                    <StatsConsentSetting />
                </TabsContent>
                <TabsContent value="homesections" className="max-w-200">
                    <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                        {t('category_homesections')}
                    </h1>
                    <p className="mb-4 text-sm text-muted-foreground">
                        {t('homesections_description')}
                    </p>
                    <div className="mt-4 space-y-3">
                        {homeScreenSections.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('no_sections_configured')}
                            </p>
                        ) : (
                            homeScreenSections.map((section, index) => (
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
                                            disabled={index === homeScreenSections.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={section.enabled !== false}
                                            onCheckedChange={(checked) => {
                                                const updated = [...homeScreenSections];
                                                updated[index] = {
                                                    ...updated[index],
                                                    enabled: checked,
                                                };
                                                setHomeScreenSections(updated);
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
                                            onClick={() => {
                                                setHomeScreenSections(
                                                    homeScreenSections.filter((_, i) => i !== index)
                                                );
                                            }}
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
                        onClick={() => {
                            setHomeScreenSections([
                                ...homeScreenSections,
                                {
                                    type: 'items',
                                    title: 'New Section',
                                    enabled: true,
                                },
                            ]);
                        }}
                        className="mt-4"
                        variant="outline"
                    >
                        <Plus />
                        {t('add_section')}
                    </Button>
                </TabsContent>
                <TabsContent value="itempage" className="max-w-200">
                    <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                        {t('category_itempage')}
                    </h1>
                    <SelectInput
                        label={t('episode_display_label')}
                        options={EPISODE_DISPLAYS.map((display) => ({
                            value: display,
                            label: t(`episode_display_${display}`),
                        }))}
                        value={episodeDisplay}
                        onChange={(value) => setEpisodeDisplay(value as 'grid' | 'row')}
                        description={t('episode_display_description')}
                    />
                    <BooleanInput
                        label={t('show_watchlist_button_label')}
                        checked={showWatchlistButton}
                        onChange={setShowWatchlistButton}
                    />
                    <BooleanInput
                        label={t('show_download_button_label')}
                        checked={showDownloadButton}
                        onChange={setShowDownloadButton}
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
                        selected={favoriteButton}
                        onChange={setFavoriteButton}
                        description={t('favorite_button_types_description')}
                    />
                    <MultiSelectInput
                        label={t('detail_badges_label')}
                        options={DETAIL_BADGES.map((badge) => ({
                            value: badge,
                            label: t(`detail_badges_${badge}`),
                        }))}
                        selected={detailBadges}
                        onChange={setDetailBadges}
                        description={t('detail_badges_description')}
                    />
                </TabsContent>
                <TabsContent value="themes" className="max-w-200">
                    <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                        {t('category_themes')}
                    </h1>
                    <p className="mb-4 text-sm text-muted-foreground">{t('themes_description')}</p>

                    <SelectInput
                        label={t('theme_selection_label')}
                        options={themeSelectOptions}
                        value={serverThemeId || ''}
                        onChange={(value) => {
                            if (value === '__DEFAULT__') {
                                setServerThemeId(null);
                                return;
                            }
                            setServerThemeId(value);
                        }}
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
                                            variant={'outline'}
                                            size={'icon'}
                                            onClick={() => {
                                                deleteTheme(theme.id);
                                            }}
                                            disabled={isDeletingTheme}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-4">
                            {t('no_themes_installed')}
                        </p>
                    )}
                </TabsContent>
                <TabsContent value="links" className="max-w-200">
                    <h1 className="mb-2 mt-2 text-2xl font-bold leading-none tracking-tight">
                        {t('category_links')}
                    </h1>
                    <p className="mb-4 text-sm text-muted-foreground">{t('links_description')}</p>

                    <div className="space-y-3">
                        {links.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('no_links_configured')}
                            </p>
                        ) : (
                            links.map((link, index) => (
                                <LinkRow
                                    key={index}
                                    link={link}
                                    onChange={(updated) => {
                                        const next = [...links];
                                        next[index] = updated;
                                        setLinks(next);
                                    }}
                                    onDelete={() => setLinks(links.filter((_, i) => i !== index))}
                                    onMoveUp={() => moveLink(index, -1)}
                                    onMoveDown={() => moveLink(index, 1)}
                                    canMoveUp={index > 0}
                                    canMoveDown={index < links.length - 1}
                                />
                            ))
                        )}
                    </div>

                    <Button
                        onClick={() => setLinks([...links, { url: '', text: '', icon: '' }])}
                        className="mt-4"
                        variant="outline"
                    >
                        <Plus />
                        {t('add_link')}
                    </Button>
                </TabsContent>
            </Tabs>
            <SectionEditor
                section={editingIndex !== null ? homeScreenSections[editingIndex] : null}
                onSave={(editedSection) => {
                    const updated = [...homeScreenSections];
                    if (editingIndex !== null) {
                        updated[editingIndex] = editedSection;
                        setHomeScreenSections(updated);
                        setEditingIndex(null);
                    }
                }}
                onClose={() => setEditingIndex(null)}
            />
            <Button className="mt-6 w-fit" onClick={handleUpdateConfig} disabled={updating}>
                {updating ? (
                    t('saving')
                ) : saveSuccess ? (
                    <>
                        <Check /> {t('save_success')}
                    </>
                ) : (
                    t('save_settings')
                )}
            </Button>
        </Page>
    );
};

export default SettingsPage;
