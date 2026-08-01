import { isDesktopApp } from '@/utils/desktopApp';

const TITLE_BAR_HEIGHT = 50;
const Z_INDEX = 40;

export function DesktopDragRegion() {
    if (!isDesktopApp()) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: TITLE_BAR_HEIGHT,
                zIndex: Z_INDEX,
            }}
        />
    );
}
