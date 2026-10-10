import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { isDesktopApp, isDesktopBuild, openExternalUrl } from '@/utils/desktopApp';

const preferenceKey = 'pelagica-automatic-updates';
const toastId = 'pelagica-update';
const checkInterval = 6 * 60 * 60 * 1000;
const isSupported = () => isDesktopBuild && isDesktopApp();
type UpdateNotice = { version: string; url: string };
const UpdatesContext = createContext<{
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    checking: boolean;
    check: () => void;
} | null>(null);

export function AutomaticUpdatesProvider({ children }: { children: ReactNode }) {
    const [enabled, setEnabled] = useState(() => {
        if (!isSupported()) return false;
        try {
            return localStorage.getItem(preferenceKey) !== 'false';
        } catch {
            return false;
        }
    });
    const [checking, setChecking] = useState(false);
    const active = useRef<AbortController | null>(null);
    const notified = useRef(new Set<string>());

    const check = useCallback(async (manual: boolean, signal?: AbortSignal) => {
        if (!isSupported() || active.current) return;
        const controller = new AbortController();
        const abort = () => controller.abort();
        signal?.addEventListener('abort', abort, { once: true });
        active.current = controller;
        setChecking(true);
        try {
            const response = await fetch('/api/desktop/updates', { signal: controller.signal });
            if (!response.ok) throw new Error('Update check failed');
            const notice: UpdateNotice | null = await response.json();
            if (controller.signal.aborted) return;
            if (notice && (manual || !notified.current.has(notice.version))) {
                notified.current.add(notice.version);
                toast.info(`Pelagica ${notice.version} is available`, {
                    id: toastId,
                    duration: Infinity,
                    description:
                        'View release notes and download on GitHub. Install manually when convenient, or use your package manager.',
                    action: { label: 'View Release', onClick: () => openExternalUrl(notice.url) },
                    cancel: { label: 'Later', onClick: () => {} },
                });
            } else if (!notice && manual) {
                toast.info('No newer compatible desktop release is available.');
            }
        } catch {
            if (manual && !controller.signal.aborted) {
                toast.error('Unable to check for updates. Try again later.', {
                    action: {
                        label: 'View Releases',
                        onClick: () =>
                            openExternalUrl('https://github.com/PelagicaApp/pelagica/releases'),
                    },
                });
            }
        } finally {
            signal?.removeEventListener('abort', abort);
            active.current = null;
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        if (!isSupported() || !enabled) return;
        const controller = new AbortController();
        // Defer startup so React's development effect replay can cancel it cleanly.
        const startup = window.setTimeout(() => void check(false, controller.signal), 0);
        const interval = window.setInterval(
            () => void check(false, controller.signal),
            checkInterval
        );
        return () => {
            window.clearTimeout(startup);
            window.clearInterval(interval);
            controller.abort();
        };
    }, [enabled, check]);

    const saveEnabled = (value: boolean) => {
        try {
            localStorage.setItem(preferenceKey, String(value));
            setEnabled(value);
            if (!value) toast.dismiss(toastId);
        } catch {
            toast.error('Unable to save the update preference.');
        }
    };

    return (
        <UpdatesContext.Provider
            value={{ enabled, setEnabled: saveEnabled, checking, check: () => void check(true) }}
        >
            {children}
        </UpdatesContext.Provider>
    );
}

export function AutomaticUpdatesPreferences() {
    const updates = useContext(UpdatesContext);
    if (!isSupported() || !updates) return null;
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
                <Label htmlFor="automatic-updates">Automatically Check for Updates</Label>
                <Switch
                    id="automatic-updates"
                    checked={updates.enabled}
                    onCheckedChange={updates.setEnabled}
                />
            </div>
            <p className="text-muted-foreground text-sm">
                Check for new releases on startup and every six hours. Downloads and installation
                are manual.
            </p>
            <Button variant="outline" disabled={updates.checking} onClick={updates.check}>
                {updates.checking ? 'Checking…' : 'Check for Updates'}
            </Button>
        </div>
    );
}
