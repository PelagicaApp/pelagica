import { useEffect, useState, type CSSProperties } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const OUTPUT_SIZE = 512;
// Smaller size for GIDs since every frame is cropped and encoded
const GIF_OUTPUT_SIZE = 256;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function cropToFile(src: string, area: Area, source: File): Promise<File> {
    if (source.type === 'image/gif') {
        const { cropGif } = await import('@/utils/cropGif');
        return cropGif(source, area, Math.round(Math.min(GIF_OUTPUT_SIZE, area.width)));
    }

    const img = await loadImage(src);
    const size = Math.min(OUTPUT_SIZE, area.width);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);

    // PNG for everything with transparency, JPEG for everything else. (Hacky but should work for now)
    const type = source.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
    if (!blob) throw new Error('Could not encode image');
    const ext = type === 'image/png' ? 'png' : 'jpg';
    return new File([blob], `avatar.${ext}`, { type });
}

const AvatarPreview = ({
    src,
    area,
    className,
}: {
    src: string;
    area: Area | null;
    className: string;
}) => {
    const style: CSSProperties | undefined = area
        ? {
              width: `${10000 / area.width}%`,
              height: `${10000 / area.height}%`,
              left: `${(-area.x * 100) / area.width}%`,
              top: `${(-area.y * 100) / area.height}%`,
          }
        : undefined;

    return (
        <div className={`relative shrink-0 overflow-hidden bg-muted ${className}`}>
            {area && <img src={src} alt="" className="absolute max-w-none" style={style} />}
        </div>
    );
};

export const AvatarCropDialog = ({
    file,
    userName,
    isUploading,
    onCancel,
    onConfirm,
}: {
    file: File | null;
    userName: string;
    isUploading: boolean;
    onCancel: () => void;
    onConfirm: (cropped: File) => void;
}) => {
    const { t } = useTranslation(['sidebar', 'common']);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [areaPercent, setAreaPercent] = useState<Area | null>(null);
    const [areaPixels, setAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(false);
    const [animationDone, setAnimationDone] = useState(false);

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        queueMicrotask(() => {
            setImageUrl(url);
            setCrop({ x: 0, y: 0 });
            setZoom(MIN_ZOOM);
            setAreaPercent(null);
            setAreaPixels(null);
            setError(false);
            setAnimationDone(false);
        });
        const timeout = setTimeout(() => setAnimationDone(true), 400);
        return () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
        };
    }, [file]);

    const busy = isProcessing || isUploading;

    const handleConfirm = async () => {
        if (!file || !imageUrl || !areaPixels || busy) return;
        setIsProcessing(true);
        setError(false);
        try {
            onConfirm(await cropToFile(imageUrl, areaPixels, file));
        } catch {
            setError(true);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog
            open={!!file}
            onOpenChange={(open) => {
                if (!open && !busy) onCancel();
            }}
        >
            <DialogContent
                onAnimationEnd={(e) => {
                    if (e.target === e.currentTarget) setAnimationDone(true);
                }}
            >
                <DialogHeader>
                    <DialogTitle>{t('change_avatar')}</DialogTitle>
                    <DialogDescription>{t('crop_avatar_description')}</DialogDescription>
                </DialogHeader>

                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                    {imageUrl && animationDone && (
                        <Cropper
                            image={imageUrl}
                            crop={crop}
                            zoom={zoom}
                            minZoom={MIN_ZOOM}
                            maxZoom={MAX_ZOOM}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropAreaChange={(percent) => setAreaPercent(percent)}
                            onCropComplete={(percent, pixels) => {
                                setAreaPercent(percent);
                                setAreaPixels(pixels);
                            }}
                        />
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
                    <Slider
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={[zoom]}
                        onValueChange={([value]) => setZoom(value)}
                        aria-label={t('zoom')}
                    />
                    <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
                </div>

                {imageUrl && (
                    <div className="flex items-center gap-4 rounded-md border p-3">
                        <span className="text-sm text-muted-foreground">{t('preview')}</span>
                        <AvatarPreview
                            src={imageUrl}
                            area={areaPercent}
                            className="h-12 w-12 rounded-lg"
                        />
                        <div className="flex min-w-0 items-center gap-2">
                            <AvatarPreview
                                src={imageUrl}
                                area={areaPercent}
                                className="h-8 w-8 rounded-lg"
                            />
                            <span className="truncate text-sm font-medium">{userName}</span>
                        </div>
                        <AvatarPreview
                            src={imageUrl}
                            area={areaPercent}
                            className="h-6 w-6 rounded-lg"
                        />
                    </div>
                )}

                {error && <p className="text-sm text-destructive">{t('avatar_update_failed')}</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={busy}>
                        {t('common:cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={!areaPixels || busy}>
                        {busy ? t('common:saving') : t('common:save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
