import { decompressFrames, parseGIF } from 'gifuct-js';
import { applyPalette, GIFEncoder, quantize } from 'gifenc';

export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const DISPOSE_RESTORE_BACKGROUND = 2;
const DISPOSE_RESTORE_PREVIOUS = 3;

function create2dCanvas(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas not supported');
    return { canvas, ctx };
}

export async function cropGif(file: File, area: CropRect, size: number): Promise<File> {
    const parsed = parseGIF(await file.arrayBuffer());
    const frames = decompressFrames(parsed, true);
    if (frames.length === 0) throw new Error('GIF has no frames');

    const full = create2dCanvas(parsed.lsd.width, parsed.lsd.height);
    const patch = create2dCanvas(1, 1);
    const out = create2dCanvas(size, size);
    out.ctx.imageSmoothingQuality = 'high';

    const encoder = GIFEncoder();

    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const { width, height, left, top } = frame.dims;

        const previous =
            frame.disposalType === DISPOSE_RESTORE_PREVIOUS
                ? full.ctx.getImageData(0, 0, full.canvas.width, full.canvas.height)
                : null;

        patch.canvas.width = width;
        patch.canvas.height = height;
        patch.ctx.putImageData(
            new ImageData(new Uint8ClampedArray(frame.patch), width, height),
            0,
            0
        );
        full.ctx.drawImage(patch.canvas, left, top);

        out.ctx.clearRect(0, 0, size, size);
        out.ctx.drawImage(full.canvas, area.x, area.y, area.width, area.height, 0, 0, size, size);
        const rgba = out.ctx.getImageData(0, 0, size, size).data;

        const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: true });
        const index = applyPalette(rgba, palette, 'rgba4444');
        const transparentIndex = palette.findIndex((color) => color[3] === 0);

        encoder.writeFrame(index, size, size, {
            palette,
            delay: frame.delay,
            transparent: transparentIndex !== -1,
            transparentIndex: Math.max(transparentIndex, 0),
            dispose: DISPOSE_RESTORE_BACKGROUND,
        });

        if (frame.disposalType === DISPOSE_RESTORE_BACKGROUND) {
            full.ctx.clearRect(left, top, width, height);
        } else if (previous) {
            full.ctx.putImageData(previous, 0, 0);
        }

        if (i % 10 === 9) await new Promise((resolve) => setTimeout(resolve));
    }

    encoder.finish();
    return new File([encoder.bytes()], 'avatar.gif', { type: 'image/gif' });
}
