import { useCallback, useEffect, useState } from 'react';
import {
    getTopBarNavHighlight,
    saveTopBarNavHighlight,
    TOP_BAR_NAV_HIGHLIGHT_CHANGE_EVENT,
} from '@/utils/localTopBarNavHighlight';

export function useTopBarNavHighlight() {
    const [highlightActivePage, setHighlightActivePageState] = useState(getTopBarNavHighlight);

    useEffect(() => {
        const onChange = (event: Event) => {
            setHighlightActivePageState((event as CustomEvent<boolean>).detail);
        };
        window.addEventListener(TOP_BAR_NAV_HIGHLIGHT_CHANGE_EVENT, onChange);
        return () => window.removeEventListener(TOP_BAR_NAV_HIGHLIGHT_CHANGE_EVENT, onChange);
    }, []);

    const setHighlightActivePage = useCallback((enabled: boolean) => {
        saveTopBarNavHighlight(enabled);
        setHighlightActivePageState(enabled);
    }, []);

    return { highlightActivePage, setHighlightActivePage };
}
