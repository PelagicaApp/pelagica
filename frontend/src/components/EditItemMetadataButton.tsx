import type {
    BaseItemDto,
    Video3DFormat,
    MetadataField,
} from '@jellyfin/sdk/lib/generated-client/models';
import {
    getApi,
    getItemCached,
    invalidateItemCache,
} from '@pelagica/core';
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';

type MetadataType =
    | 'Basic'
    | 'ExternalIds'
    | 'Genres'
    | 'Tags'
    | 'People'
    | 'Studios'
    | 'MetadataSettings'
    | 'EnabledFields';

const EditItemMetadataButton = ({
    item,
    trigger,
}: {
    item: BaseItemDto;
    trigger: React.ReactNode;
}) => {
    const { t } = useTranslation('item');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [metadataType, setMetadataType] = useState<MetadataType>('Basic');

    const [title, setTitle] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');
    const [path, setPath] = useState('');
    const [sortTitle, setSortTitle] = useState('');
    const [dateAdded, setDateAdded] = useState('');
    const [communityRating, setCommunityRating] = useState('');
    const [criticsRating, setCriticsRating] = useState('');
    const [tagline, setTagline] = useState('');
    const [overview, setOverview] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [year, setYear] = useState('');
    const [parentalRating, setParentalRating] = useState('');
    const [customRating, setCustomRating] = useState('');
    const [originalAspectRatio, setOriginalAspectRatio] = useState('');
    const [threedFormat, setThreedFormat] = useState<Video3DFormat | 'None' | ''>('');

    const [providerIds, setProviderIds] = useState<Record<string, string | null>>({});
    const [genres, setGenres] = useState<string[]>([]);
    const [genreInput, setGenreInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [studio, setStudio] = useState<string[]>([]);
    const [studioInput, setStudioInput] = useState('');
    const [seriesNumber, setSeriesNumber] = useState('');
    const [episodeNumber, setEpisodeNumber] = useState('');
    const [lockData, setLockData] = useState(false);
    const [lockedFields, setLockedFields] = useState<MetadataField[]>([]);
    const [preferredLanguage, setPreferredLanguage] = useState('');
    const [preferredCountry, setPreferredCountry] = useState('');

    const { editItemMetadata, isSaving } = useEditItemMetadata(() => {
        setIsEditDialogOpen(false);
    });

    // ---- fetch full item when dialog opens ----
    const { data: fullItem } = useQuery({
        queryKey: ['fullItem', item.Id],
        queryFn: () => getItemCached(item.Id!),
        enabled: isEditDialogOpen && !!item.Id,
    });

    const { data: metadataEditorInfo } = useQuery({
        queryKey: ['metadataEditorInfo', item.Id],
        queryFn: async () => {
            const api = getApi();
            return (await getItemUpdateApi(api).getMetadataEditorInfo({ itemId: item.Id! })).data;
        },
        enabled: isEditDialogOpen && !!item.Id,
    });

    useEffect(() => {
        if (!fullItem) return;
        startTransition(() => {
            setTitle(fullItem.Name ?? '');
            setPath(fullItem.Path ?? '');
            setOriginalTitle(fullItem.OriginalTitle ?? '');
            setSortTitle(fullItem.ForcedSortName ?? '');
            setOverview(fullItem.Overview ?? '');
            setTagline(fullItem.Taglines?.[0] ?? '');
            setCommunityRating(String(fullItem.CommunityRating ?? ''));
            setCriticsRating(String(fullItem.CriticRating ?? ''));
            setParentalRating(fullItem.OfficialRating ?? '');
            setCustomRating(fullItem.CustomRating ?? '');
            setThreedFormat((fullItem.Video3DFormat ?? 'None') as Video3DFormat | 'None');
            setYear(String(fullItem.ProductionYear ?? ''));
            setReleaseDate(fullItem.PremiereDate?.split('T')[0] ?? '');
            setProviderIds((fullItem.ProviderIds ?? {}) as Record<string, string | null>);
            setGenres(fullItem.Genres ?? []);
            setTags(fullItem.Tags ?? []);
            setStudio(fullItem.Studios?.map((s) => s.Name ?? '') ?? []);
            setSeriesNumber(
                fullItem.ParentIndexNumber != null ? String(fullItem.ParentIndexNumber) : ''
            );
            setEpisodeNumber(fullItem.IndexNumber != null ? String(fullItem.IndexNumber) : '');
            setLockData(fullItem.LockData ?? false);
            setLockedFields((fullItem.LockedFields ?? []) as MetadataField[]);
            setPreferredLanguage(fullItem.PreferredMetadataLanguage ?? '');
            setPreferredCountry(fullItem.PreferredMetadataCountryCode ?? '');
        });
    }, [fullItem]);

    const addTag = () => {
        if (!tagInput.trim()) return;
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const addGenre = () => {
        if (!genreInput.trim()) return;
        setGenres([...genres, genreInput.trim()]);
        setGenreInput('');
    };

    const removeGenre = (index: number) => {
        setGenres(genres.filter((_, i) => i !== index));
    };

    const addStudio = () => {
        if (!studioInput.trim()) return;
        setStudio([...studio, studioInput.trim()]);
        setStudioInput('');
    };

    const removeStudio = (index: number) => {
        setStudio(studio.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!item.Id) return;
        editItemMetadata({
            itemId: item.Id,
            baseItemDto: {
                ...fullItem,
                Name: title,
                OriginalTitle: originalTitle,
                SortName: sortTitle,
                Overview: overview,
                Taglines: tagline ? [tagline] : item.Taglines,
                CommunityRating: communityRating ? parseFloat(communityRating) : undefined,
                CriticRating: criticsRating ? parseFloat(criticsRating) : undefined,
                OfficialRating: parentalRating,
                CustomRating: customRating,
                Video3DFormat:
                    threedFormat === 'None' ? undefined : (threedFormat as Video3DFormat),
                ProductionYear: year ? parseInt(year) : undefined,
                PremiereDate: releaseDate ? `${releaseDate}T00:00:00.0000000Z` : undefined,
                Genres: genres,
                Tags: tags,
                Studios: studio.map((name) => ({ Name: name })),
                ForcedSortName: sortTitle,
                ParentIndexNumber: seriesNumber ? parseInt(seriesNumber) : undefined,
                IndexNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
                ProviderIds: Object.fromEntries(
                    Object.entries(providerIds)
                        .filter(([, v]) => v != null)
                        .map(([k, v]) => [k, v as string])
                ) as Record<string, string>,
                LockData: lockData,
                LockedFields: lockedFields,
                PreferredMetadataLanguage: preferredLanguage,
                PreferredMetadataCountryCode: preferredCountry,
            },
        });
    };
    // console.log('item', fullItem);
    return (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t('edit_metadata_title')}</DialogTitle>
                    <DialogDescription>{t('edit_metadata_description')}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-8">
                    <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium">{t('metadata_type')}</Label>
                        <Select
                            value={metadataType}
                            onValueChange={(value) => setMetadataType(value as MetadataType)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={'Basic'}>{t('basic')}</SelectItem>
                                <SelectItem value={'ExternalIds'}>{t('external_ids')}</SelectItem>
                                <SelectItem value={'Genres'}>{t('genres')}</SelectItem>
                                <SelectItem value={'Tags'}>{t('tags')}</SelectItem>
                                <SelectItem value={'People'}>{t('people')}</SelectItem>
                                <SelectItem value={'Studios'}>{t('studios')}</SelectItem>
                                <SelectItem value={'MetadataSettings'}>
                                    {t('metadata_settings')}
                                </SelectItem>
                                <SelectItem value={'EnabledFields'}>
                                    {t('enabled_fields')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {metadataType === 'Basic' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('path')}
                                </Label>
                                <Input
                                    type="text"
                                    value={path}
                                    disabled
                                    className="font-mono text-sm bg-muted text-muted-foreground cursor-not-allowed rounded-md border px-3 py-2"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('title')}
                                </Label>
                                <Input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('original_title')}
                                </Label>
                                <Input
                                    type="text"
                                    value={originalTitle}
                                    onChange={(e) => setOriginalTitle(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('sort_title')}
                                </Label>
                                <Input
                                    type="text"
                                    value={sortTitle}
                                    onChange={(e) => setSortTitle(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('date_added')}
                                </Label>
                                <Input
                                    type="date"
                                    value={dateAdded}
                                    onChange={(e) => setDateAdded(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            {fullItem?.Type === 'Episode' && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1 flex-1">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            {t('series_number')}
                                        </Label>
                                        <Input
                                            type="number"
                                            value={seriesNumber}
                                            onChange={(e) => setSeriesNumber(e.target.value)}
                                            className="text-sm rounded-md border px-3 py-2"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            {t('episode_number')}
                                        </Label>
                                        <Input
                                            type="number"
                                            value={episodeNumber}
                                            onChange={(e) => setEpisodeNumber(e.target.value)}
                                            className="text-sm rounded-md border px-3 py-2"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {t('community_rating')}
                                    </Label>
                                    <Input
                                        type="number"
                                        value={communityRating}
                                        onChange={(e) => setCommunityRating(e.target.value)}
                                        className="text-sm rounded-md border px-3 py-2"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {t('critics_rating')}
                                    </Label>
                                    <Input
                                        type="number"
                                        value={criticsRating}
                                        onChange={(e) => setCriticsRating(e.target.value)}
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        className="text-sm rounded-md border px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('tagline')}
                                </Label>
                                <Input
                                    type="text"
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('overview')}
                                </Label>
                                <Input
                                    type="text"
                                    value={overview}
                                    onChange={(e) => setOverview(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('release_date')}
                                </Label>
                                <Input
                                    type="date"
                                    value={releaseDate}
                                    onChange={(e) => setReleaseDate(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('release_year')}
                                </Label>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="text-sm rounded-md border px-3 py-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {t('parental_rating')}
                                    </Label>
                                    <Select
                                        value={parentalRating}
                                        onValueChange={setParentalRating}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {metadataEditorInfo?.ParentalRatingOptions?.map(
                                                (rating, index) => (
                                                    <SelectItem
                                                        key={index}
                                                        value={rating.Name ?? 'unrated'}
                                                    >
                                                        {rating.Name}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {t('custom_rating')}
                                    </Label>
                                    <Select value={customRating} onValueChange={setCustomRating}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {metadataEditorInfo?.ParentalRatingOptions?.map(
                                                (rating, index) => (
                                                    <SelectItem
                                                        key={index}
                                                        value={rating.Name ?? 'unrated'}
                                                    >
                                                        {rating.Name}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {t('original_aspect_ratio')}
                                    </Label>
                                    <Input
                                        type="text"
                                        value={originalAspectRatio}
                                        onChange={(e) => setOriginalAspectRatio(e.target.value)}
                                        className="text-sm rounded-md border px-3 py-2"
                                    />
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {t('threed_format')}
                                    </Label>
                                    <Select
                                        value={threedFormat}
                                        onValueChange={(value) =>
                                            setThreedFormat(value as Video3DFormat | 'None' | '')
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={'None'}>None</SelectItem>
                                            <SelectItem value={'HalfSideBySide'}>HSBS</SelectItem>
                                            <SelectItem value={'FullSideBySide'}>FSBS</SelectItem>
                                            <SelectItem value={'HalfTopAndBottom'}>HTAB</SelectItem>
                                            <SelectItem value={'FullTopAndBottom'}>FTAB</SelectItem>
                                            <SelectItem value={'MVC'}>MVC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                    {metadataType === 'ExternalIds' && (
                        <div className="flex flex-col gap-4">
                            {!metadataEditorInfo && (
                                <p className="text-sm text-muted-foreground">{t('loading')}</p>
                            )}
                            {metadataEditorInfo?.ExternalIdInfos?.map((info) => (
                                <div key={info.Key} className="flex flex-col gap-1">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        {info.Name}
                                    </Label>
                                    <Input
                                        type="text"
                                        value={providerIds[info.Key ?? ''] ?? ''}
                                        onChange={(e) =>
                                            setProviderIds({
                                                ...providerIds,
                                                [info.Key ?? '']: e.target.value,
                                            })
                                        }
                                        className="text-sm rounded-md border px-3 py-2"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    {metadataType === 'People' && (
                        <div className="flex flex-col gap-2">
                            {fullItem?.People?.map((person, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{person.Name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {person.Type} {person.Role ? `— ${person.Role}` : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {metadataType === 'Tags' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                    placeholder={t('add_tag')}
                                    className="text-sm rounded-md border px-3 py-2 flex-1"
                                />
                                <Button onClick={addTag}>{t('add')}</Button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {tags.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-md border px-3 py-2"
                                    >
                                        <span className="text-sm">{tag}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeTag(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {metadataType === 'Studios' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={studioInput}
                                    onChange={(e) => setStudioInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addStudio()}
                                    placeholder={t('add_studio')}
                                    className="text-sm rounded-md border px-3 py-2 flex-1"
                                />
                                <Button onClick={addStudio}>{t('add')}</Button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {studio.map((studio, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-md border px-3 py-2"
                                    >
                                        <span className="text-sm">{studio}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeStudio(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {metadataType === 'Genres' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={genreInput}
                                    onChange={(e) => setGenreInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addGenre()}
                                    placeholder={t('add_genre')}
                                    className="text-sm rounded-md border px-3 py-2 flex-1"
                                />
                                <Button onClick={addGenre}>{t('add')}</Button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {genres.map((genre, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-md border px-3 py-2"
                                    >
                                        <span className="text-sm">{genre}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeGenre(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {metadataType === 'MetadataSettings' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('preferred_language')}
                                </Label>
                                <Select
                                    value={preferredLanguage}
                                    onValueChange={setPreferredLanguage}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('inherit_default')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={'inherit'}>
                                            {t('inherit_default')}
                                        </SelectItem>
                                        {metadataEditorInfo?.Cultures?.map((culture) => (
                                            <SelectItem
                                                key={culture.TwoLetterISOLanguageName}
                                                value={culture.TwoLetterISOLanguageName ?? ''}
                                            >
                                                {culture.DisplayName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('preferred_country')}
                                </Label>
                                <Select
                                    value={preferredCountry}
                                    onValueChange={setPreferredCountry}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('inherit_default')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={'inherit'}>
                                            {t('inherit_default')}
                                        </SelectItem>
                                        {metadataEditorInfo?.Countries?.map((country) => (
                                            <SelectItem
                                                key={country.TwoLetterISORegionName}
                                                value={country.TwoLetterISORegionName ?? ''}
                                            >
                                                {country.DisplayName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Label className="flex items-center gap-2">
                                <Checkbox
                                    checked={lockData}
                                    onCheckedChange={(checked) => setLockData(!!checked)}
                                />
                                <span className="text-sm font-medium">{t('lock_data')}</span>
                            </Label>
                        </div>
                    )}
                    {metadataType === 'EnabledFields' && (
                        <div className="flex flex-col gap-4">
                            {[
                                'Name',
                                'Overview',
                                'Genres',
                                'ParentalRating',
                                'People',
                                'ProductionLocations',
                                'Studios',
                                'Tags',
                            ].map((field) => (
                                <Label key={field} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={!lockedFields.includes(field as MetadataField)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setLockedFields(
                                                    lockedFields.filter(
                                                        (f) => f !== (field as MetadataField)
                                                    )
                                                );
                                            } else {
                                                setLockedFields([
                                                    ...lockedFields,
                                                    field as MetadataField,
                                                ]);
                                            }
                                        }}
                                    />
                                    <span className="text-sm font-medium">
                                        {t(field.toLowerCase())}
                                    </span>
                                </Label>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant={'outline'} onClick={() => setIsEditDialogOpen(false)}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={!item.Id || isSaving}>
                        {isSaving ? t('saving') : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditItemMetadataButton;
