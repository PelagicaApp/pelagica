import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock, Download, ImageOff, Library } from 'lucide-react';
import {
    getSeerrItemBackdropUrl,
    getSeerrItemPosterUrl,
    SeerrMediaStatus,
    SeerrRequestStatus,
    useRequestSeerrItem,
    useSeerrItemDetails,
    type SeerrMediaStatus as SeerrMediaStatusType,
    type SeerrMediaType,
} from '@pelagica/core';
import { useNavigate, useParams } from '@/router';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import FocusableButton from '@/components/FocusableButton';
import { toast } from '@/components/ui/toast';
import { getSeerrLibraryPath } from '@/lib/seerrItemPath';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useLayerFocusable } from '@/router/useLayerFocusable';

function parseMediaType(value: string | undefined): SeerrMediaType | undefined {
    return value === 'movie' || value === 'tv' ? value : undefined;
}

const statusBadge = (status: SeerrMediaStatusType | undefined, t: (key: string) => string) => {
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
            return null;
    }
};

const SeerrItem = () => {
    const { t } = useTranslation('seerr');
    const navigate = useNavigate();
    const { mediaType: mediaTypeParam, tmdbId: tmdbIdParam } = useParams<{
        mediaType: string;
        tmdbId: string;
    }>();
    const mediaType = parseMediaType(mediaTypeParam);
    const tmdbId = Number(tmdbIdParam);
    const hasValidId = Number.isFinite(tmdbId) && tmdbId > 0;

    const {
        data: details,
        isLoading,
        isError,
    } = useSeerrItemDetails(mediaType, hasValidId ? tmdbId : undefined, !!mediaType && hasValidId);
    const requestMutation = useRequestSeerrItem();

    const { ref, focusKey } = useLayerFocusable<object, HTMLDivElement>({
        saveLastFocusedChild: true,
    });

    const status = details?.mediaInfo?.status;
    const isAvailable =
        status === SeerrMediaStatus.AVAILABLE || status === SeerrMediaStatus.PARTIALLY_AVAILABLE;
    const isRequested = status !== undefined && status !== SeerrMediaStatus.UNKNOWN;

    const requestedSeasonNumbers = useMemo(() => {
        const set = new Set<number>();
        details?.mediaInfo?.requests?.forEach((request) => {
            if (request.status === SeerrRequestStatus.DECLINED) return;
            request.seasons?.forEach((season) => set.add(season.seasonNumber));
        });
        return set;
    }, [details]);

    const seasonStatusMap = useMemo(() => {
        const map = new Map<number, SeerrMediaStatusType>();
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

    const visibleSeasons = useMemo(
        () =>
            details?.seasons?.filter(
                (season) => season.seasonNumber !== 0 && season.episodeCount !== 0
            ) ?? [],
        [details]
    );

    const requestableSeasons = useMemo(() => {
        if (mediaType !== 'tv') return [];
        return visibleSeasons.filter((season) => {
            const seasonStatus = seasonStatusMap.get(season.seasonNumber);
            return seasonStatus === undefined || seasonStatus === SeerrMediaStatus.UNKNOWN;
        });
    }, [visibleSeasons, mediaType, seasonStatusMap]);

    const [deselectedSeasons, setDeselectedSeasons] = useState<Set<number>>(new Set());
    const itemKey = mediaType && hasValidId ? `${mediaType}-${tmdbId}` : null;
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
            if (next.has(seasonNumber)) next.delete(seasonNumber);
            else next.add(seasonNumber);
            return next;
        });
    };

    const isTv = mediaType === 'tv';
    const showRequestButton = isTv ? requestableSeasons.length > 0 : !isAvailable && !isRequested;
    const isRequestDisabled =
        requestMutation.isPending || (isTv && selectedSeasonNumbers.length === 0);

    const handleRequest = () => {
        if (!mediaType || !hasValidId) return;
        if (isTv && selectedSeasonNumbers.length === 0) return;
        requestMutation.mutate(
            {
                mediaType,
                mediaId: tmdbId,
                seasons: isTv ? selectedSeasonNumbers : undefined,
            },
            {
                onSuccess: () =>
                    toast.add({ type: 'success', title: t('seerr_request_success') }),
                onError: () => toast.add({ type: 'error', title: t('seerr_request_failed') }),
            }
        );
    };

    if (!mediaType || !hasValidId) {
        return <p className="text-sm text-destructive">{t('seerr_failed_to_load')}</p>;
    }

    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className="relative flex flex-col gap-6">
                {details?.backdropPath && (
                    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden opacity-40">
                        <img
                            src={getSeerrItemBackdropUrl(details.backdropPath)}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-background/80" />
                    </div>
                )}

                {isLoading ? (
                    <div className="flex gap-6">
                        <Skeleton className="aspect-2/3 w-48 shrink-0 rounded-md" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-8 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                ) : isError || !details ? (
                    <p className="text-sm text-destructive">{t('seerr_failed_to_load')}</p>
                ) : (
                    <>
                        <div className="flex gap-6">
                            <div className="aspect-2/3 w-48 shrink-0 overflow-hidden rounded-md bg-muted">
                                {details.posterPath ? (
                                    <img
                                        src={getSeerrItemPosterUrl(details.posterPath)}
                                        alt={details.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <ImageOff className="text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex flex-wrap items-baseline gap-2">
                                    <h1 className="text-3xl font-bold leading-tight">
                                        {details.title}
                                    </h1>
                                    {details.releaseDate && (
                                        <span className="text-lg text-muted-foreground">
                                            {new Date(details.releaseDate).getFullYear()}
                                        </span>
                                    )}
                                </div>
                                {statusBadge(status, t)}
                                {details.overview && (
                                    <p className="max-w-3xl text-sm text-muted-foreground">
                                        {details.overview}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    {details.mediaInfo?.jellyfinMediaId && (
                                        <FocusableButton
                                            autoFocus
                                            onClick={() =>
                                                navigate(
                                                    getSeerrLibraryPath(
                                                        details.mediaType,
                                                        details.mediaInfo!.jellyfinMediaId!
                                                    )
                                                )
                                            }
                                        >
                                            <Library />
                                            {t('seerr_open_in_library')}
                                        </FocusableButton>
                                    )}
                                    {showRequestButton && (
                                        <FocusableButton
                                            autoFocus={!details.mediaInfo?.jellyfinMediaId}
                                            disabled={isRequestDisabled}
                                            onClick={handleRequest}
                                        >
                                            <Download />
                                            {requestMutation.isPending
                                                ? t('seerr_requesting')
                                                : isTv
                                                  ? t('seerr_request_seasons_count', {
                                                        count: selectedSeasonNumbers.length,
                                                    })
                                                  : t('seerr_request')}
                                        </FocusableButton>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isTv && visibleSeasons.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold">{t('seerr_select_seasons')}</h2>
                                <div className="flex flex-wrap gap-2">
                                    {visibleSeasons.map((season) => {
                                        const seasonStatus = seasonStatusMap.get(season.seasonNumber);
                                        const isSeasonRequestable =
                                            seasonStatus === undefined ||
                                            seasonStatus === SeerrMediaStatus.UNKNOWN;
                                        const selected =
                                            isSeasonRequestable &&
                                            !deselectedSeasons.has(season.seasonNumber);
                                        return (
                                            <FocusableButton
                                                key={season.seasonNumber}
                                                size="sm"
                                                variant={selected ? 'default' : 'outline'}
                                                disabled={!isSeasonRequestable}
                                                onClick={() =>
                                                    isSeasonRequestable &&
                                                    toggleSeason(season.seasonNumber)
                                                }
                                            >
                                                {t('seerr_season_number', {
                                                    number: season.seasonNumber,
                                                })}
                                            </FocusableButton>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </FocusContext.Provider>
    );
};

export default SeerrItem;
