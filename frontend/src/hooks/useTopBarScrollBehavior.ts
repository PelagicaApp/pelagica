import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { usePageScrollElement } from '@/hooks/usePageScrollElement';

const SCROLL_DIRECTION_THRESHOLD = 8;
const TOP_REVEAL_THRESHOLD = 20;

function getNestedScrollTargets(root: HTMLElement | null): HTMLElement[] {
    if (!root) return [];
    return Array.from(root.querySelectorAll('[data-page-scroll-nested]')).filter(
        (el): el is HTMLElement => el instanceof HTMLElement
    );
}

function readScrollTop(elements: HTMLElement[]): number {
    return Math.max(window.scrollY, ...elements.map((el) => el.scrollTop));
}

export function useTopBarScrollBehavior() {
    const scrollElement = usePageScrollElement();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [barHidden, setBarHidden] = useState(false);
    const [barPeek, setBarPeek] = useState(false);
    const [trackedPathname, setTrackedPathname] = useState(location.pathname);

    if (trackedPathname !== location.pathname) {
        setTrackedPathname(location.pathname);
        setBarHidden(false);
        setBarPeek(false);
        setScrolled(false);
    }

    useEffect(() => {
        const nestedTargets = getNestedScrollTargets(scrollElement);
        const scrollTargets = scrollElement ? [scrollElement, ...nestedTargets] : nestedTargets;

        let lastScrollTop = readScrollTop(scrollTargets);

        const onScroll = () => {
            const scrollTop = readScrollTop(scrollTargets);
            setScrolled(scrollTop > TOP_REVEAL_THRESHOLD);

            if (scrollTop <= TOP_REVEAL_THRESHOLD) {
                setBarHidden(false);
                setBarPeek(false);
            } else if (scrollTop - lastScrollTop > SCROLL_DIRECTION_THRESHOLD) {
                setBarHidden(true);
                setBarPeek(false);
            } else if (lastScrollTop - scrollTop > SCROLL_DIRECTION_THRESHOLD) {
                setBarHidden(false);
            }

            lastScrollTop = scrollTop;
        };

        onScroll();

        window.addEventListener('scroll', onScroll, { passive: true });
        for (const target of scrollTargets) {
            target.addEventListener('scroll', onScroll, { passive: true });
        }

        return () => {
            window.removeEventListener('scroll', onScroll);
            for (const target of scrollTargets) {
                target.removeEventListener('scroll', onScroll);
            }
        };
    }, [scrollElement, location.pathname]);

    const showBar = !barHidden || barPeek;

    return { scrolled, showBar, barHidden, setBarPeek };
}
