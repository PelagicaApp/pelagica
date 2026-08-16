type Direction = 'up' | 'down' | 'left' | 'right';
type NavigationKey = Direction | 'enter';

const STICK_DEADZONE = 0.5;
const INITIAL_REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 150;

// https://w3c.github.io/gamepad/#remapping
const BUTTON_CONFIRM = 0; // A / Cross
const BUTTON_BACK = 1; // B / Circle
const BUTTON_DPAD_UP = 12;
const BUTTON_DPAD_DOWN = 13;
const BUTTON_DPAD_LEFT = 14;
const BUTTON_DPAD_RIGHT = 15;

const KEY_NAMES: Record<NavigationKey, string> = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    enter: 'Enter',
};

function dispatchKey(type: 'keydown' | 'keyup', key: string) {
    window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
}

function dispatchBackKey() {
    const event = new Event('tizenhwkey') as TizenHwKeyEvent;
    event.keyName = 'back';
    window.dispatchEvent(event);
}

function resolveDirection(pad: Gamepad): Direction | null {
    if (pad.buttons[BUTTON_DPAD_UP]?.pressed) return 'up';
    if (pad.buttons[BUTTON_DPAD_DOWN]?.pressed) return 'down';
    if (pad.buttons[BUTTON_DPAD_LEFT]?.pressed) return 'left';
    if (pad.buttons[BUTTON_DPAD_RIGHT]?.pressed) return 'right';

    const [x = 0, y = 0] = pad.axes;
    if (Math.abs(y) > Math.abs(x)) {
        if (y <= -STICK_DEADZONE) return 'up';
        if (y >= STICK_DEADZONE) return 'down';
    } else {
        if (x <= -STICK_DEADZONE) return 'left';
        if (x >= STICK_DEADZONE) return 'right';
    }
    return null;
}

export function initGamepadNavigation() {
    if (typeof navigator.getGamepads !== 'function') return;

    const heldDirectionByPad = new Map<number, { direction: Direction; nextRepeatAt: number }>();
    const confirmPressedByPad = new Set<number>();
    const backPressedByPad = new Set<number>();

    function poll() {
        const now = performance.now();

        for (const pad of navigator.getGamepads()) {
            if (!pad) continue;

            const direction = resolveDirection(pad);
            const held = heldDirectionByPad.get(pad.index);

            if (direction !== held?.direction) {
                if (held) dispatchKey('keyup', KEY_NAMES[held.direction]);
                if (direction) {
                    dispatchKey('keydown', KEY_NAMES[direction]);
                    heldDirectionByPad.set(pad.index, {
                        direction,
                        nextRepeatAt: now + INITIAL_REPEAT_DELAY_MS,
                    });
                } else {
                    heldDirectionByPad.delete(pad.index);
                }
            } else if (held && now >= held.nextRepeatAt) {
                dispatchKey('keydown', KEY_NAMES[held.direction]);
                held.nextRepeatAt = now + REPEAT_INTERVAL_MS;
            }

            const confirmPressed = pad.buttons[BUTTON_CONFIRM]?.pressed ?? false;
            if (confirmPressed && !confirmPressedByPad.has(pad.index)) {
                confirmPressedByPad.add(pad.index);
                dispatchKey('keydown', KEY_NAMES.enter);
            } else if (!confirmPressed && confirmPressedByPad.has(pad.index)) {
                confirmPressedByPad.delete(pad.index);
                dispatchKey('keyup', KEY_NAMES.enter);
            }

            const backPressed = pad.buttons[BUTTON_BACK]?.pressed ?? false;
            if (backPressed && !backPressedByPad.has(pad.index)) {
                backPressedByPad.add(pad.index);
                dispatchBackKey();
            } else if (!backPressed && backPressedByPad.has(pad.index)) {
                backPressedByPad.delete(pad.index);
            }
        }

        requestAnimationFrame(poll);
    }

    requestAnimationFrame(poll);
}
