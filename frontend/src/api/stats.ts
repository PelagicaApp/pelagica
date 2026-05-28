export type StatsConsent = 'granted' | 'denied' | 'unknown';

const numberToStatsConsent = (value: number): StatsConsent => {
    switch (value) {
        case 2:
            return 'denied';
        case 1:
            return 'unknown';
        case 0:
            return 'granted';
        default:
            throw new Error(`Invalid stats consent value: ${value}`);
    }
};

export const getStatsConsent = async (): Promise<StatsConsent> => {
    const res = await fetch('/api/stats-consent');
    if (!res.ok) {
        throw new Error('Failed to fetch stats consent');
    }
    const data = await res.json();
    console.log('Stats consent value from server:', data.consent);
    return numberToStatsConsent(data.consent);
};

export const setStatsConsent = async (consent: boolean): Promise<void> => {
    const res = await fetch('/api/stats-consent?consent=' + consent, {
        method: 'POST',
    });
    if (!res.ok) {
        throw new Error('Failed to set stats consent');
    }
};
