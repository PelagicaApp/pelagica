import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy, Info } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { TFunction } from 'i18next';

const DetailBox = ({ label, value }: { label: string; value: string }) => {
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className="group">
            <h4 className="font-medium">{label}</h4>
            <div className="flex items-center gap-0.5">
                <p className="text-sm text-muted-foreground max-w-full break-all">{value}</p>
                <Button
                    variant={'ghost'}
                    size={'icon-sm'}
                    className="text-muted-foreground"
                    onClick={handleCopy}
                >
                    {copySuccess ? (
                        <Check className="h-3! w-3!" />
                    ) : (
                        <Copy className="h-3.5! w-3.5!" />
                    )}
                </Button>
            </div>
        </div>
    );
};

const getStreamTypeLabel = (type: string | undefined, t: TFunction): string => {
    switch (type) {
        case 'Video':
            return t('video');
        case 'Audio':
            return t('audio');
        case 'Subtitle':
            return t('subtitle');
        case 'EmbeddedImage':
            return t('image');
        default:
            return type || 'Stream';
    }
};

const MediaStreamInfo = ({ stream, t }: { stream: MediaStream; t: TFunction }) => {
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    const getStreamDetails = (stream: MediaStream) => {
        const details: Array<{ label: string; value: string }> = [];

        if (stream.Title) {
            details.push({ label: t('title'), value: stream.Title });
        }

        if (stream.Type === 'Video') {
            if (stream.Codec) details.push({ label: t('codec'), value: stream.Codec });
            if (stream.Profile) details.push({ label: t('profile'), value: stream.Profile });
            if (stream.Level !== undefined && stream.Level !== null)
                details.push({ label: t('level'), value: String(stream.Level) });
            if (stream.Width && stream.Height) {
                details.push({
                    label: t('resolution'),
                    value: `${stream.Width}x${stream.Height}`,
                });
            }
            if (stream.AspectRatio)
                details.push({ label: t('aspect_ratio'), value: stream.AspectRatio });
            if (stream.IsAnamorphic !== undefined)
                details.push({
                    label: t('anamorphic'),
                    value: stream.IsAnamorphic ? t('yes') : t('no'),
                });
            if (stream.IsInterlaced !== undefined)
                details.push({
                    label: t('interlaced'),
                    value: stream.IsInterlaced ? t('yes') : t('no'),
                });
            if (stream.RealFrameRate)
                details.push({ label: t('framerate'), value: String(stream.RealFrameRate) });
            if (stream.BitRate)
                details.push({ label: t('bitrate'), value: `${stream.BitRate} bps` });
            if (stream.BitDepth)
                details.push({ label: t('bit_depth'), value: `${stream.BitDepth} bit` });
            if (stream.VideoRange)
                details.push({ label: t('video_range'), value: stream.VideoRange });
            if (stream.VideoRangeType)
                details.push({ label: t('video_range_type'), value: stream.VideoRangeType });
            if (stream.ColorSpace)
                details.push({ label: t('color_space'), value: stream.ColorSpace });
            if (stream.ColorTransfer)
                details.push({ label: t('color_transfer'), value: stream.ColorTransfer });
            if (stream.ColorPrimaries)
                details.push({ label: t('color_primaries'), value: stream.ColorPrimaries });
            if (stream.PixelFormat)
                details.push({ label: t('pixel_format'), value: stream.PixelFormat });
            if (stream.RefFrames !== undefined && stream.RefFrames !== null)
                details.push({ label: t('ref_frames'), value: String(stream.RefFrames) });
        } else if (stream.Type === 'Audio') {
            if (stream.Language) details.push({ label: t('language'), value: stream.Language });
            if (stream.Codec) details.push({ label: t('codec'), value: stream.Codec });
            if (stream.Profile) details.push({ label: t('profile'), value: stream.Profile });
            if (stream.ChannelLayout)
                details.push({ label: t('layout'), value: stream.ChannelLayout });
            if (stream.Channels !== undefined && stream.Channels !== null)
                details.push({ label: t('channels'), value: `${stream.Channels} ch` });
            if (stream.BitRate)
                details.push({ label: t('bitrate'), value: `${stream.BitRate} bps` });
            if (stream.SampleRate)
                details.push({ label: t('sample_rate'), value: `${stream.SampleRate} Hz` });
            if (stream.IsDefault !== undefined)
                details.push({
                    label: t('default'),
                    value: stream.IsDefault ? t('yes') : t('no'),
                });
            if (stream.IsForced !== undefined)
                details.push({
                    label: t('forced'),
                    value: stream.IsForced ? t('yes') : t('no'),
                });
            if (stream.IsExternal !== undefined)
                details.push({
                    label: t('external'),
                    value: stream.IsExternal ? t('yes') : t('no'),
                });
        } else if (stream.Type === 'Subtitle') {
            if (stream.Language) details.push({ label: t('language'), value: stream.Language });
            if (stream.Codec) details.push({ label: t('codec'), value: stream.Codec });
            if (stream.IsDefault !== undefined)
                details.push({
                    label: t('default'),
                    value: stream.IsDefault ? t('yes') : t('no'),
                });
            if (stream.IsForced !== undefined)
                details.push({
                    label: t('forced'),
                    value: stream.IsForced ? t('yes') : t('no'),
                });
            if (stream.IsExternal !== undefined)
                details.push({
                    label: t('external'),
                    value: stream.IsExternal ? t('yes') : t('no'),
                });
        } else if (stream.Type === 'EmbeddedImage') {
            if (stream.Codec) details.push({ label: t('codec'), value: stream.Codec });
            if (stream.Profile) details.push({ label: t('profile'), value: stream.Profile });
            if (stream.Width && stream.Height) {
                details.push({
                    label: t('resolution'),
                    value: `${stream.Width}x${stream.Height}`,
                });
            }
            if (stream.BitDepth)
                details.push({ label: t('bit_depth'), value: `${stream.BitDepth} bit` });
            if (stream.ColorSpace)
                details.push({ label: t('color_space'), value: stream.ColorSpace });
            if (stream.PixelFormat)
                details.push({ label: t('pixel_format'), value: stream.PixelFormat });
            if (stream.RefFrames !== undefined && stream.RefFrames !== null)
                details.push({ label: t('ref_frames'), value: String(stream.RefFrames) });
        }

        return details;
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-2">
                <h3 className="text-lg font-semibold">{getStreamTypeLabel(stream.Type, t)}</h3>
                <Button
                    variant={'ghost'}
                    size={'icon-sm'}
                    className="text-muted-foreground"
                    onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(stream, null, 2)).then(() => {
                            setCopySuccess(true);
                            setTimeout(() => setCopySuccess(false), 2000);
                        });
                    }}
                >
                    {copySuccess ? (
                        <Check className="h-3! w-3!" />
                    ) : (
                        <Copy className="h-3.5! w-3.5!" />
                    )}
                </Button>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {getStreamDetails(stream).map((detail, index) => (
                    <DetailBox key={index} label={detail.label} value={detail.value} />
                ))}
            </div>
        </div>
    );
};

interface MediaInfoDialogProps {
    streams: MediaStream[];
    path?: string | null;
    trigger?: React.ReactNode;
}

const MediaInfoDialog = ({ streams, path, trigger }: MediaInfoDialogProps) => {
    const { t } = useTranslation('item');
    const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);

    const videoStreams = streams.filter((s) => s.Type === 'Video');
    const audioStreams = streams.filter((s) => s.Type === 'Audio');
    const subtitleStreams = streams.filter((s) => s.Type === 'Subtitle');
    const otherStreams = streams.filter((s) => {
        return s.Type !== 'Video' && s.Type !== 'Audio' && s.Type !== 'Subtitle';
    });

    const selectedStream = streams[selectedStreamIndex];

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button variant={'outline'} size={'icon'}>
                        <Info />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('media_info')}</DialogTitle>
                </DialogHeader>
                {path && <DetailBox label={t('path')} value={path} />}
                <Select
                    onValueChange={(value) => setSelectedStreamIndex(parseInt(value, 10))}
                    value={selectedStreamIndex.toString()}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t('select_stream')} />
                    </SelectTrigger>
                    <SelectContent>
                        {videoStreams.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>{t('video')}</SelectLabel>
                                {videoStreams.map((stream, index) => (
                                    <SelectItem
                                        key={index}
                                        value={streams.indexOf(stream).toString()}
                                    >
                                        {`${t('video')} #${stream.Index || index + 1}${stream.Title ? ` - ${stream.Title}` : ''}`}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                        {audioStreams.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>{t('audio')}</SelectLabel>
                                {audioStreams.map((stream, index) => (
                                    <SelectItem
                                        key={index}
                                        value={streams.indexOf(stream).toString()}
                                    >
                                        {`${t('audio')} #${stream.Index || index + 1}${stream.Title ? ` - ${stream.Title}` : stream.Language ? ` - ${stream.Language}` : ''}`}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                        {subtitleStreams.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>{t('subtitle')}</SelectLabel>
                                {subtitleStreams.map((stream, index) => (
                                    <SelectItem
                                        key={index}
                                        value={streams.indexOf(stream).toString()}
                                    >
                                        {`${t('subtitle')} #${stream.Index || index + 1}${stream.Title ? ` - ${stream.Title}` : stream.Language ? ` - ${stream.Language}` : ''}`}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                        {otherStreams.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>{t('other')}</SelectLabel>
                                {otherStreams.map((stream, index) => (
                                    <SelectItem
                                        key={index}
                                        value={streams.indexOf(stream).toString()}
                                    >
                                        {`${stream.Type} #${stream.Index || index + 1}${stream.Title ? ` - ${stream.Title}` : ''}`}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                    </SelectContent>
                </Select>
                {selectedStream && <MediaStreamInfo stream={selectedStream} t={t} />}
            </DialogContent>
        </Dialog>
    );
};

export default MediaInfoDialog;
