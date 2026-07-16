import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
    Check,
    Clapperboard,
    Clock,
    Download,
    ExternalLink,
    Film,
    ImageOff,
    Library,
    TvMinimalPlay,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfig } from '@/hooks/api/useConfig';
import { useSeerrItemDetails } from '@/hooks/api/useSeerrItemDetails';
import { useRequestSeerrItem } from '@/hooks/api/useRequestSeerrItem';
import { getSeerrItemBackdropUrl, getSeerrItemPosterUrl, getSeerrItemUrl } from '@/utils/seerUrls';
import { SeerrMediaStatus, SeerrRequestStatus, type SeerrMediaType } from '@/api/seerr/types';
import type { SeerrDialogItem } from '@/context/SeerrItemDialogContext';

interface SeerrItemDialogProps {
    item: SeerrDialogItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ItemTypeBadge = ({ mediaType }: { mediaType: SeerrMediaType }) => {
    const { t } = useTranslation('seerr');
    const label = mediaType === 'movie' ? t('seerr_movie') : t('seerr_tv_show');
    const icon = mediaType === 'movie' ? <Clapperboard /> : <TvMinimalPlay />;
    return (
        <Badge variant="outline">
            {icon}
            {label}
        </Badge>
    );
};

const mediaStatusBadge = (
    status: SeerrMediaStatus | undefined,
    t: (key: string) => string,
    notRequestedLabel?: string
) => {
    switch (status) {
        case SeerrMediaStatus.AVAILABLE:
            return (
                <Badge variant="default">
                    <Check />
                    {t('seerr_status_available')}
                </Badge>
            );
        case SeerrMediaStatus.PARTIALLY_AVAILABLE:
            return (
                <Badge variant="secondary">
                    <Check />
                    {t('seerr_status_partially_available')}
                </Badge>
            );
        case SeerrMediaStatus.PROCESSING:
            return (
                <Badge variant="secondary">
                    <Clock />
                    {t('seerr_status_processing')}
                </Badge>
            );
        case SeerrMediaStatus.PENDING:
            return (
                <Badge variant="secondary">
                    <Clock />
                    {t('seerr_status_pending')}
                </Badge>
            );
        default:
            return notRequestedLabel ? <Badge variant="outline">{notRequestedLabel}</Badge> : null;
    }
};

const SeerrItemDialog = ({ item, open, onOpenChange }: SeerrItemDialogProps) => {
    const { t } = useTranslation('seerr');
    const navigate = useNavigate();
    const { config } = useConfig();
    const seerrUrl = config?.seerrUrl;

    const {
        data: details,
        isLoading,
        isError,
    } = useSeerrItemDetails(item?.mediaType, item?.id, open);
    const requestMutation = useRequestSeerrItem();

    const status = details?.mediaInfo?.status;
    const isAvailable =
        status === SeerrMediaStatus.AVAILABLE || status === SeerrMediaStatus.PARTIALLY_AVAILABLE;
    const isRequested = status !== undefined && status !== SeerrMediaStatus.UNKNOWN;
    const trailerUrl = details?.relatedVideos?.find((video) => video.type === 'Trailer')?.url;

    const requestedSeasonNumbers = useMemo(() => {
        const set = new Set<number>();
        details?.mediaInfo?.requests?.forEach((request) => {
            if (request.status === SeerrRequestStatus.DECLINED) return;
            request.seasons?.forEach((season) => set.add(season.seasonNumber));
        });
        return set;
    }, [details]);

    const seasonStatusMap = useMemo(() => {
        const map = new Map<number, SeerrMediaStatus>();
        details?.mediaInfo?.seasons?.forEach((season) => {
            map.set(season.seasonNumber, season.status);
        });
        requestedSeasonNumbers.forEach((seasonNumber) => {
            const existing = map.get(seasonNumber);
            if (existing === undefined || existing === SeerrMediaStatus.UNKNOWN) {
                map.set(seasonNumber, SeerrMediaStatus.PENDING);
            }
        });
        return map;
    }, [details, requestedSeasonNumbers]);

    // Season 0 (Specials) aren't requestable through seer it seems, and seasons
    // with 0 episodes (e.g. an announced-but-unaired season) aren't useful to show
    const visibleSeasons = useMemo(
        () =>
            details?.seasons?.filter(
                (season) => season.seasonNumber !== 0 && season.episodeCount !== 0
            ) ?? [],
        [details]
    );

    const requestableSeasons = useMemo(() => {
        if (item?.mediaType !== 'tv') return [];
        return visibleSeasons.filter((season) => {
            const seasonStatus = seasonStatusMap.get(season.seasonNumber);
            return seasonStatus === undefined || seasonStatus === SeerrMediaStatus.UNKNOWN;
        });
    }, [visibleSeasons, item, seasonStatusMap]);

    const [deselectedSeasons, setDeselectedSeasons] = useState<Set<number>>(new Set());
    const itemKey = item ? `${item.mediaType}-${item.id}` : null;
    const [seasonSelectionKey, setSeasonSelectionKey] = useState(itemKey);
    if (itemKey !== seasonSelectionKey) {
        setSeasonSelectionKey(itemKey);
        setDeselectedSeasons(new Set());
    }

    const selectedSeasonNumbers = useMemo(
        () =>
            requestableSeasons
                .filter((season) => !deselectedSeasons.has(season.seasonNumber))
                .map((season) => season.seasonNumber),
        [requestableSeasons, deselectedSeasons]
    );

    const toggleSeason = (seasonNumber: number) => {
        setDeselectedSeasons((prev) => {
            const next = new Set(prev);
            if (next.has(seasonNumber)) {
                next.delete(seasonNumber);
            } else {
                next.add(seasonNumber);
            }
            return next;
        });
    };

    const allSeasonsSelected =
        requestableSeasons.length > 0 && selectedSeasonNumbers.length === requestableSeasons.length;
    const toggleSelectAllSeasons = () => {
        setDeselectedSeasons(
            allSeasonsSelected
                ? new Set(requestableSeasons.map((season) => season.seasonNumber))
                : new Set()
        );
    };

    const isTv = item?.mediaType === 'tv';
    const showRequestButton = isTv ? requestableSeasons.length > 0 : !isAvailable && !isRequested;
    const isRequestDisabled =
        requestMutation.isPending || (isTv && selectedSeasonNumbers.length === 0);

    const handleRequest = () => {
        if (!item) return;
        if (isTv && selectedSeasonNumbers.length === 0) return;
        requestMutation.mutate(
            {
                mediaType: item.mediaType,
                mediaId: item.id,
                seasons: isTv ? selectedSeasonNumbers : undefined,
            },
            {
                onSuccess: () => toast.success(t('seerr_request_success')),
                onError: () => toast.error(t('seerr_request_failed')),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="group sm:max-w-2xl p-0 overflow-hidden">
                {details?.backdropPath && (
                    <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-data-[state=open]:opacity-100">
                        <img
                            src={getSeerrItemBackdropUrl(details.backdropPath)}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-background/85" />
                    </div>
                )}
                <div className="max-h-[85vh] overflow-y-auto p-6">
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            {isLoading ? t('seerr_loading_details') : (details?.title ?? '')}
                        </DialogTitle>
                    </DialogHeader>
                    {isLoading ? (
                        <div className="flex gap-6">
                            <Skeleton className="w-40 sm:w-48 aspect-2/3 rounded-md shrink-0" />
                            <div className="flex-1 space-y-3">
                                <Skeleton className="h-8 w-2/3" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ) : isError ? (
                        <p className="text-sm text-destructive">{t('seerr_failed_to_load')}</p>
                    ) : details ? (
                        <>
                            <div className="flex gap-6">
                                <div className="w-40 sm:w-48 aspect-2/3 rounded-md overflow-hidden bg-muted shrink-0">
                                    {details.posterPath ? (
                                        <img
                                            src={getSeerrItemPosterUrl(details.posterPath)}
                                            alt={details.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageOff className="text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div>
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <h2 className="text-2xl font-bold leading-tight">
                                                {details.title}
                                            </h2>
                                            {details.releaseDate && (
                                                <span className="text-base text-muted-foreground">
                                                    {new Date(details.releaseDate).getFullYear()}
                                                </span>
                                            )}
                                        </div>
                                        {mediaStatusBadge(status, t) && (
                                            <div className="mt-2">
                                                {mediaStatusBadge(status, t)}
                                            </div>
                                        )}
                                    </div>
                                    {details.overview && (
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {details.overview}
                                        </p>
                                    )}
                                    {details.genres && details.genres.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <ItemTypeBadge mediaType={details.mediaType} />
                                            {details.genres.map((genre) => (
                                                <Badge key={genre.id} variant="outline">
                                                    {genre.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    {trailerUrl && (
                                        <Button variant="secondary" size="sm" asChild>
                                            <a
                                                href={trailerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Film />
                                                {t('seerr_watch_trailer')}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {isTv && requestableSeasons.length > 0 && (
                                <div className="my-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {t('seerr_select_seasons')}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-xs text-muted-foreground hover:underline"
                                            onClick={toggleSelectAllSeasons}
                                        >
                                            {allSeasonsSelected
                                                ? t('seerr_deselect_all')
                                                : t('seerr_select_all')}
                                        </button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto rounded-md border bg-background/80">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-muted/80 text-xs text-muted-foreground">
                                                <tr>
                                                    <th className="w-10 px-3 py-2" />
                                                    <th className="px-3 py-2 text-left font-medium">
                                                        {t('seerr_season_column')}
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium">
                                                        {t('seerr_episodes_column')}
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium">
                                                        {t('seerr_status_column')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibleSeasons.map((season) => {
                                                    const seasonStatus = seasonStatusMap.get(
                                                        season.seasonNumber
                                                    );
                                                    const isSeasonRequestable =
                                                        seasonStatus === undefined ||
                                                        seasonStatus === SeerrMediaStatus.UNKNOWN;
                                                    const label = t('seerr_season_number', {
                                                        number: season.seasonNumber,
                                                    });
                                                    return (
                                                        <tr
                                                            key={season.seasonNumber}
                                                            className="border-t first:border-t-0"
                                                        >
                                                            <td className="px-3 py-2">
                                                                <Switch
                                                                    checked={
                                                                        isSeasonRequestable
                                                                            ? !deselectedSeasons.has(
                                                                                  season.seasonNumber
                                                                              )
                                                                            : true
                                                                    }
                                                                    disabled={!isSeasonRequestable}
                                                                    onCheckedChange={() =>
                                                                        toggleSeason(
                                                                            season.seasonNumber
                                                                        )
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">{label}</td>
                                                            <td className="px-3 py-2 text-muted-foreground">
                                                                {season.episodeCount ?? '—'}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                {mediaStatusBadge(
                                                                    seasonStatus,
                                                                    t,
                                                                    t('seerr_status_not_requested')
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                    <DialogFooter>
                        {seerrUrl && item && (
                            <Button variant="outline" asChild>
                                <a
                                    href={getSeerrItemUrl({
                                        seerrUrl,
                                        tmdbId: item.id,
                                        mediaType: item.mediaType,
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t('seerr_open_in_seerr')}
                                    <ExternalLink />
                                </a>
                            </Button>
                        )}
                        {details?.mediaInfo?.jellyfinMediaId && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false);
                                    navigate(`/item/${details.mediaInfo!.jellyfinMediaId}`);
                                }}
                            >
                                <Library />
                                {t('seerr_open_in_library')}
                            </Button>
                        )}
                        {!isLoading && !isError && showRequestButton && (
                            <Button onClick={handleRequest} disabled={isRequestDisabled}>
                                <Download />
                                {requestMutation.isPending
                                    ? t('seerr_requesting')
                                    : isTv
                                      ? t('seerr_request_seasons_count', {
                                            count: selectedSeasonNumbers.length,
                                        })
                                      : t('seerr_request')}
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SeerrItemDialog;
