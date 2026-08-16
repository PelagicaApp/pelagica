import type { BaseItemDto, RemoteSearchResult } from '@jellyfin/sdk/lib/generated-client/models';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ImageOff, Search } from 'lucide-react';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Spinner } from './ui/spinner';
import {
    useApplySearchCriteria,
    useExternalIdInfos,
    useMovieRemoteSearchResults,
    useSeriesRemoteSearchResults,
} from '@pelagica/core';

type IdentifyStep = 'search' | 'results' | 'confirm';

const IdentifyItemButton = ({ item, trigger }: { item: BaseItemDto; trigger: React.ReactNode }) => {
    const { t } = useTranslation('item');
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<IdentifyStep>('search');

    const [name, setName] = useState('');
    const [year, setYear] = useState('');
    const [providerIds, setProviderIds] = useState<Record<string, string>>({});
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedResult, setSelectedResult] = useState<RemoteSearchResult | null>(null);
    const [replaceExistingImages, setReplaceExistingImages] = useState(false);

    const { data: externalIdInfos } = useExternalIdInfos(item.Id);

    const searchQuery = useMemo(
        () => ({
            ItemId: item.Id,
            SearchInfo: {
                Name: name.trim() || undefined,
                Year: year.trim() ? parseInt(year, 10) : undefined,
                ProviderIds: Object.keys(providerIds).length ? providerIds : undefined,
            },
        }),
        [item.Id, name, year, providerIds]
    );

    const isMovie = item.Type === 'Movie';
    const isSeries = item.Type === 'Series';

    const movieResults = useMovieRemoteSearchResults(searchQuery, hasSearched && isMovie);
    const seriesResults = useSeriesRemoteSearchResults(searchQuery, hasSearched && isSeries);
    const { data: results, isFetching: isSearching } = isMovie ? movieResults : seriesResults;

    const { mutate: applySearchCriteria, isPending: isApplying } = useApplySearchCriteria();

    const canSearch = !!(
        name.trim() ||
        year.trim() ||
        Object.values(providerIds).some((v) => v.trim())
    );

    const resetState = () => {
        setStep('search');
        setName('');
        setYear('');
        setProviderIds({});
        setHasSearched(false);
        setSelectedResult(null);
        setReplaceExistingImages(false);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) resetState();
    };

    const handleSearch = () => {
        if (!canSearch) return;
        setHasSearched(true);
        setStep('results');
    };

    const handleSelectResult = (result: RemoteSearchResult) => {
        setSelectedResult(result);
        setStep('confirm');
    };

    const handleApply = () => {
        if (!item.Id || !selectedResult) return;
        applySearchCriteria(
            {
                itemId: item.Id,
                remoteSearchResult: selectedResult,
                replaceAllImages: replaceExistingImages,
            },
            { onSuccess: () => setIsOpen(false) }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t('identify_item_title')}</DialogTitle>
                    <DialogDescription>{t('identify_item_description')}</DialogDescription>
                </DialogHeader>

                {step === 'search' && (
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {item.Path && (
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm font-medium text-muted-foreground">
                                    {t('path')}
                                </Label>
                                <span className="text-sm text-foreground">{item.Path}</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm font-medium text-muted-foreground">
                                {t('name')}
                            </Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                        {!!externalIdInfos?.length && (
                            <div className="flex flex-col gap-4">
                                <Label className="text-sm font-medium">{t('external_ids')}</Label>
                                {externalIdInfos.map((info) => (
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
                        {!canSearch && (
                            <p className="text-sm text-muted-foreground">
                                {t('identify_search_hint')}
                            </p>
                        )}
                    </div>
                )}

                {step === 'results' && (
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {isSearching && (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                <Spinner />
                                {t('searching')}
                            </div>
                        )}
                        {!isSearching && !results?.length && (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                {t('no_results_found')}
                            </p>
                        )}
                        {!isSearching &&
                            results?.map((result, index) => (
                                <button
                                    key={`${result.SearchProviderName ?? ''}-${index}`}
                                    onClick={() => handleSelectResult(result)}
                                    className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent"
                                >
                                    {result.ImageUrl ? (
                                        <img
                                            src={result.ImageUrl}
                                            alt=""
                                            className="h-16 w-11 shrink-0 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-muted">
                                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate">
                                            {result.Name}
                                            {result.ProductionYear
                                                ? ` (${result.ProductionYear})`
                                                : ''}
                                        </span>
                                        {result.SearchProviderName && (
                                            <span className="text-xs text-muted-foreground">
                                                {result.SearchProviderName}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                    </div>
                )}

                {step === 'confirm' && selectedResult && (
                    <div className="flex-1 overflow-y-auto space-y-4">
                        <div className="flex items-center gap-3">
                            {selectedResult.ImageUrl ? (
                                <img
                                    src={selectedResult.ImageUrl}
                                    alt=""
                                    className="h-24 w-16 shrink-0 rounded object-cover"
                                />
                            ) : (
                                <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded bg-muted">
                                    <ImageOff className="h-4 w-4 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-medium truncate">
                                    {selectedResult.Name}
                                    {selectedResult.ProductionYear
                                        ? ` (${selectedResult.ProductionYear})`
                                        : ''}
                                </span>
                                {selectedResult.SearchProviderName && (
                                    <span className="text-sm text-muted-foreground">
                                        {selectedResult.SearchProviderName}
                                    </span>
                                )}
                            </div>
                        </div>
                        {selectedResult.Overview && (
                            <p className="text-sm text-muted-foreground line-clamp-4">
                                {selectedResult.Overview}
                            </p>
                        )}
                        <Label className="flex items-center gap-2">
                            <Checkbox
                                checked={replaceExistingImages}
                                onCheckedChange={(checked) => setReplaceExistingImages(!!checked)}
                            />
                            <span className="text-sm font-medium">
                                {t('replace_existing_images')}
                            </span>
                        </Label>
                    </div>
                )}

                <DialogFooter>
                    {step === 'search' && (
                        <>
                            <Button variant={'outline'} onClick={() => setIsOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleSearch} disabled={!canSearch}>
                                <Search />
                                {t('search')}
                            </Button>
                        </>
                    )}
                    {step === 'results' && (
                        <Button variant={'outline'} onClick={() => setStep('search')}>
                            {t('previous')}
                        </Button>
                    )}
                    {step === 'confirm' && (
                        <>
                            <Button variant={'outline'} onClick={() => setStep('results')}>
                                {t('previous')}
                            </Button>
                            <Button onClick={handleApply} disabled={isApplying}>
                                {isApplying ? <Spinner /> : <Check />}
                                {isApplying ? t('saving') : t('identify_apply')}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default IdentifyItemButton;
