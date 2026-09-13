import { useCallback } from 'react';
import { CircleCheck } from 'lucide-react';
import { useSetStatsConsent, useStatsConsent } from '@pelagica/core';
import { Trans, useTranslation } from 'react-i18next';
import { useBackKeyIntercept } from '@/router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import FocusableButton from './FocusableButton';

const StatsConsentModal = () => {
    const { t } = useTranslation('common');
    const { data: statsConsent } = useStatsConsent();
    const setStatsConsent = useSetStatsConsent();

    const open = statsConsent === 'unknown';

    // Swallow the back key entirely while the prompt is open, mirroring the web
    // dialog's blocked escape key and outside click.
    const interceptBackKey = useCallback(() => open, [open]);
    useBackKeyIntercept(interceptBackKey);

    if (!open) return null;

    const handleConsent = (consent: boolean) => {
        setStatsConsent.mutate(consent);
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-6">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-xl">{t('stats_consent_title')}</CardTitle>
                    <CardDescription className="text-sm">
                        <Trans
                            i18nKey="stats_consent_message"
                            components={{
                                anchor: <span className="underline" />,
                            }}
                        />
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end gap-2">
                    <FocusableButton
                        variant="outline"
                        onClick={() => handleConsent(false)}
                        disabled={setStatsConsent.isPending}
                    >
                        {t('stats_consent_reject')}
                    </FocusableButton>
                    <FocusableButton
                        autoFocus
                        onClick={() => handleConsent(true)}
                        disabled={setStatsConsent.isPending}
                    >
                        <CircleCheck />
                        {t('stats_consent_accept')}
                    </FocusableButton>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatsConsentModal;
