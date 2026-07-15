import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Clapperboard, Download, ExternalLink, ImageOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfig } from '@/hooks/api/useConfig';
import { useSeerrItemDetails } from '@/hooks/api/useSeerrItemDetails';
import { useRequestSeerrItem } from '@/hooks/api/useRequestSeerrItem';
import { getSeerrItemBackdropUrl, getSeerrItemPosterUrl, getSeerrItemUrl } from '@/utils/seerUrls';
import { SeerrMediaStatus } from '@/api/seerr/types';
import type { SeerrDialogItem } from '@/context/SeerrItemDialogContext';

interface SeerrItemDialogProps {
    item: SeerrDialogItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusBadge = (status: SeerrMediaStatus | undefined, t: (key: string) => string) => {
    switch (status) {
        case SeerrMediaStatus.AVAILABLE:
            return <Badge variant="default">{t('seerr_status_available')}</Badge>;
        case SeerrMediaStatus.PARTIALLY_AVAILABLE:
            return <Badge variant="secondary">{t('seerr_status_partially_available')}</Badge>;
        case SeerrMediaStatus.PROCESSING:
            return <Badge variant="secondary">{t('seerr_status_processing')}</Badge>;
        case SeerrMediaStatus.PENDING:
            return <Badge variant="secondary">{t('seerr_status_pending')}</Badge>;
        default:
            return null;
    }
};

const SeerrItemDialog = ({ item, open, onOpenChange }: SeerrItemDialogProps) => {
    const { t } = useTranslation('search');
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

    const handleRequest = () => {
        if (!item) return;
        requestMutation.mutate(
            {
                mediaType: item.mediaType,
                mediaId: item.id,
                seasons: item.mediaType === 'tv' ? 'all' : undefined,
            },
            {
                onSuccess: () => toast.success(t('seerr_request_success')),
                onError: () => toast.error(t('seerr_request_failed')),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
                {details?.backdropPath && (
                    <div className="absolute inset-0 -z-10">
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
                                    {statusBadge(status, t) && (
                                        <div className="mt-2">{statusBadge(status, t)}</div>
                                    )}
                                </div>
                                {details.overview && (
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {details.overview}
                                    </p>
                                )}
                                {details.genres && details.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
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
                                            <Clapperboard />
                                            {t('seerr_watch_trailer')}
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
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
                        {!isLoading && !isError && !isAvailable && !isRequested && (
                            <Button onClick={handleRequest} disabled={requestMutation.isPending}>
                                <Download />
                                {requestMutation.isPending
                                    ? t('seerr_requesting')
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
