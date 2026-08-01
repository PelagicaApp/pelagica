import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.querySelectorAll('[data-page-scroll-root], [data-page-scroll-nested]').forEach(
            (el) => {
                el.scrollTop = 0;
            }
        );
    }, [pathname]);

    return null;
}
