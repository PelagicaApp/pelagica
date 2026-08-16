import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Wires the TV remote's Return/Back key to browser-style back navigation,
 * exiting the app only when already at the root route (there's no browser
 * chrome on a TV to fall back on).
 */
export function useTvBackKey(onIntercept?: () => boolean) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        function handleHwKey(event: Event) {
            const keyName = (event as TizenHwKeyEvent).keyName;
            if (keyName !== 'back') return;
            if (onIntercept?.()) return;

            if (location.pathname === '/') {
                window.tizen?.application.getCurrentApplication().exit();
            } else {
                navigate(-1);
            }
        }

        window.addEventListener('tizenhwkey', handleHwKey);
        return () => window.removeEventListener('tizenhwkey', handleHwKey);
    }, [location.pathname, navigate, onIntercept]);
}
