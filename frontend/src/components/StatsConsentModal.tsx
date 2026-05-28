import { CircleCheck } from 'lucide-react';
import { useSetStatsConsent } from '../hooks/api/useSetStatsConsent';
import { useStatsConsent } from '../hooks/api/useStatsConsent';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';

const StatsConsentModal = () => {
    const { data: statsConsent } = useStatsConsent();
    const setStatsConsent = useSetStatsConsent();

    if (statsConsent === undefined) return null;

    const open = statsConsent === 'unknown';

    const handleConsent = (consent: boolean) => {
        setStatsConsent.mutate(consent);
    };

    return (
        <Dialog open={open}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle>Help us count</DialogTitle>
                    <DialogDescription>
                        We have no way to know how many people use Pelagica unless you tell us.
                        Opting in sends a daily ping with your version and a random ID. That's it.
                        The results are public at{' '}
                        <a
                            href="https://stats.pelagica.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            stats.pelagica.app
                        </a>
                        .
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleConsent(false)}
                        disabled={setStatsConsent.isPending}
                    >
                        No thanks
                    </Button>
                    <Button
                        onClick={() => handleConsent(true)}
                        disabled={setStatsConsent.isPending}
                    >
                        <CircleCheck />
                        {setStatsConsent.isPending ? 'Saving…' : 'Accept'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StatsConsentModal;
