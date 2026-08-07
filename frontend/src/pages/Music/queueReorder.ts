export function reorderArray<T>(array: T[], from: number, to: number): T[] {
    const result = [...array];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
}

export function reorderWithCurrentIndex<T>(
    array: T[],
    from: number,
    to: number,
    currentIndex: number
): { queue: T[]; currentIndex: number } {
    if (from === to) {
        return { queue: array, currentIndex };
    }

    const queue = reorderArray(array, from, to);
    let nextIndex = currentIndex;

    if (from === currentIndex) {
        nextIndex = to;
    } else if (from < currentIndex && to >= currentIndex) {
        nextIndex = currentIndex - 1;
    } else if (from > currentIndex && to <= currentIndex) {
        nextIndex = currentIndex + 1;
    }

    return { queue, currentIndex: nextIndex };
}

export function dropIndexAtY(listElement: HTMLElement, clientY: number): number {
    const items = listElement.querySelectorAll('[data-queue-item]');
    if (items.length === 0) return 0;

    for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
            return i;
        }
    }

    return items.length - 1;
}
