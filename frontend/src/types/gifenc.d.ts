declare module 'gifenc' {
    export type Palette = number[][];
    export type ColorFormat = 'rgb565' | 'rgb444' | 'rgba4444';

    export function quantize(
        rgba: Uint8Array | Uint8ClampedArray,
        maxColors: number,
        options?: {
            format?: ColorFormat;
            oneBitAlpha?: boolean | number;
            clearAlpha?: boolean;
            clearAlphaThreshold?: number;
            clearAlphaColor?: number;
        }
    ): Palette;

    export function applyPalette(
        rgba: Uint8Array | Uint8ClampedArray,
        palette: Palette,
        format?: ColorFormat
    ): Uint8Array;

    export interface GIFStream {
        writeFrame(
            index: Uint8Array,
            width: number,
            height: number,
            opts?: {
                palette?: Palette;
                first?: boolean;
                transparent?: boolean;
                transparentIndex?: number;
                delay?: number;
                repeat?: number;
                dispose?: number;
            }
        ): void;
        finish(): void;
        bytes(): Uint8Array<ArrayBuffer>;
        bytesView(): Uint8Array;
    }

    export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): GIFStream;
}
