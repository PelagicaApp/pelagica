import type { FlagComponent } from 'country-flag-icons/react/3x2';
import { US, DE, SE, FR, PT, JP } from 'country-flag-icons/react/3x2';

interface SupportedLanguage {
    code: string;
    Flag: FlagComponent;
    label: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { code: 'en', Flag: US, label: 'English' },
    { code: 'de', Flag: DE, label: 'Deutsch' },
    { code: 'sv', Flag: SE, label: 'Svenska' },
    { code: 'fr', Flag: FR, label: 'Français' },
    { code: 'pt', Flag: PT, label: 'Português' },
    { code: 'ja', Flag: JP, label: '日本語' },
];
