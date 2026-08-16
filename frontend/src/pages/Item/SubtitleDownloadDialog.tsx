import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Captions, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { getAccessToken, getServerUrl } from '@pelagica/core';

interface SubtitleDownloadDialogProps {
    item: BaseItemDto;
    trigger?: React.ReactNode;
}

interface SubtitleEntry {
    stream: MediaStream;
    mediaSourceId: string;
    rawUrl?: string;
    convertedUrl: string | null;
    filename: string;
    isImageBased: boolean;
}

const IMAGE_BASED_CODECS = new Set([
    'pgssub',
    'pgs',
    'dvdsub',
    'dvbsub',
    'vobsub',
    'xsub',
    'hdmv_pgs_subtitle',
    'dvb_subtitle',
]);

const codecToFormat = (codec: string): string => {
    const c = codec.toLowerCase();
    if (c === 'subrip' || c === 'srt') return 'srt';
    if (c === 'webvtt' || c === 'vtt') return 'vtt';
    if (c === 'ass') return 'ass';
    if (c === 'ssa') return 'ssa';
    if (c === 'mov_text' || c === 'tx3g') return 'srt'; // server can convert these to srt
    if (c === 'ttml' || c === 'dfxp') return 'srt';
    // Fallback: ask the server for srt and let it convert if possible.
    return 'srt';
};

const buildSubtitleEntries = (item: BaseItemDto): SubtitleEntry[] => {
    const base = getServerUrl();
    const entries: SubtitleEntry[] = [];

    for (const source of item.MediaSources ?? []) {
        if (!source.Id) continue;
        for (const stream of source.MediaStreams ?? []) {
            if (stream.Type !== 'Subtitle' || stream.Index == null) continue;

            const codec = (stream.Codec || '').toLowerCase();
            const isImageBased = IMAGE_BASED_CODECS.has(codec);
            // Image-based subs can't be served via the text Stream endpoint at all.
            const targetFormat = isImageBased ? null : codecToFormat(codec);

            const convertedUrl = targetFormat
                ? `${base}/Videos/${item.Id}/${source.Id}/Subtitles/${stream.Index}/Stream.${targetFormat}`
                : null;

            const rawUrl =
                stream.IsExternal && stream.DeliveryUrl
                    ? stream.DeliveryUrl.startsWith('http')
                        ? stream.DeliveryUrl
                        : `${base}${stream.DeliveryUrl.startsWith('/') ? '' : '/'}${stream.DeliveryUrl}`
                    : undefined;

            const langPart = stream.Language || 'und';
            const labelPart = stream.IsForced ? '.forced' : stream.IsDefault ? '.default' : '';
            const ext = targetFormat || codec || 'sub';
            const filename = `${item.Name || item.Id}.${langPart}${labelPart}.${ext}`;

            entries.push({
                stream,
                mediaSourceId: source.Id,
                rawUrl,
                convertedUrl,
                filename,
                isImageBased,
            });
        }
    }

    return entries;
};

const triggerDownload = async (url: string, filename: string) => {
    const token = getAccessToken();
    const response = await fetch(url, {
        headers: token ? { Authorization: `MediaBrowser Token="${token}"` } : {},
    });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
};

const SubtitleDownloadDialog = ({ item, trigger }: SubtitleDownloadDialogProps) => {
    const { t } = useTranslation('item');
    const entries = useMemo(() => buildSubtitleEntries(item), [item]);
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const handleDownload = async (key: string, url: string, filename: string) => {
        if (loadingKey) return; // prevent concurrent downloads
        setLoadingKey(key);
        try {
            await triggerDownload(url, filename);
        } catch (error) {
            console.error('Subtitle download failed:', error);
        } finally {
            setLoadingKey(null);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="icon" title={t('subtitles')}>
                        <Captions />
                        {t('subtitles')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('subtitles')}</DialogTitle>
                    <DialogDescription>{t('subtitle_download_description')}</DialogDescription>
                </DialogHeader>

                {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                        {t('no_subtitles_available')}
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                        {entries.map((entry) => {
                            const { stream } = entry;
                            const title =
                                stream.DisplayTitle ||
                                stream.Title ||
                                stream.Language ||
                                t('unknown_subtitle');

                            const entryKey = `${entry.mediaSourceId}-${stream.Index}`;
                            const rawKey = `${entryKey}-raw`;
                            const convertedKey = `${entryKey}-converted`;
                            const isRawLoading = loadingKey === rawKey;
                            const isConvertedLoading = loadingKey === convertedKey;
                            const anyLoading = loadingKey !== null;

                            return (
                                <li
                                    key={entryKey}
                                    className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card"
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium truncate">{title}</span>
                                        <span className="text-xs text-muted-foreground flex flex-wrap gap-2">
                                            <span>{stream.Codec?.toUpperCase()}</span>
                                            {stream.IsExternal && <span>{t('external')}</span>}
                                            {stream.IsForced && <span>{t('forced')}</span>}
                                            {stream.IsDefault && <span>{t('default')}</span>}
                                            {entry.isImageBased && <span>{t('image_based')}</span>}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {entry.rawUrl && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleDownload(
                                                        rawKey,
                                                        entry.rawUrl!,
                                                        entry.filename
                                                    )
                                                }
                                                disabled={anyLoading}
                                                title={t('download_original_file')}
                                            >
                                                {isRawLoading ? (
                                                    <Loader2 className="animate-spin" />
                                                ) : (
                                                    <FileText />
                                                )}
                                                {t('original')}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                entry.convertedUrl &&
                                                handleDownload(
                                                    convertedKey,
                                                    entry.convertedUrl,
                                                    entry.filename
                                                )
                                            }
                                            disabled={
                                                (!entry.convertedUrl && !entry.rawUrl) || anyLoading
                                            }
                                            title={t('download')}
                                        >
                                            {isConvertedLoading ? (
                                                <Loader2 className="animate-spin" />
                                            ) : (
                                                <Download />
                                            )}
                                            {t('download')}
                                        </Button>
                                        {entry.convertedUrl && (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="ghost"
                                                title={t('open_in_new_tab')}
                                            >
                                                <a
                                                    href={entry.convertedUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SubtitleDownloadDialog;
