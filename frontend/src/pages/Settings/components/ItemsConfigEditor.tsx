import { useTranslation } from 'react-i18next';
import type { Option } from '@/components/ui/multi-select';
import type { SectionItemsConfig } from '@/hooks/api/useConfig';
import { useUserViews } from '@/hooks/api/useUserViews';
import { StringInput, BooleanInput, SelectInput, MultiSelectInput } from './SettingsInputs';

export const ItemsConfigEditor = ({
    items,
    onChange,
}: {
    items: SectionItemsConfig | undefined;
    onChange: (items: SectionItemsConfig) => void;
}) => {
    const { t } = useTranslation('settings');
    const { data: userViews } = useUserViews();

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
                onChange={(selected) =>
                    onChange({ ...current, sortBy: selected as SectionItemsConfig['sortBy'] })
                }
            />
            <SelectInput
                label={t('sort_order')}
                options={[
                    { value: 'Ascending', label: t('ascending') },
                    { value: 'Descending', label: t('descending') },
                ]}
                value={current.sortOrder || 'Descending'}
                onChange={(value) =>
                    onChange({ ...current, sortOrder: value as 'Ascending' | 'Descending' })
                }
            />
            <MultiSelectInput
                label={t('item_types')}
                options={typeOptions}
                selected={(current.types as string[]) || []}
                onChange={(selected) =>
                    onChange({ ...current, types: selected as SectionItemsConfig['types'] })
                }
            />
            <SelectInput
                label={t('library_id')}
                options={[
                    { value: '__NONE__', label: t('library_id_all') },
                    ...(userViews?.Items || [])
                        .filter((v) => v.Id && v.Name)
                        .map((v) => ({ value: v.Id!, label: v.Name! })),
                ]}
                value={current.libraryId || '__NONE__'}
                onChange={(value) =>
                    onChange({ ...current, libraryId: value === '__NONE__' ? undefined : value })
                }
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
