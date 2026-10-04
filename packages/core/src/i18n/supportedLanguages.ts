import type { FlagComponent } from 'country-flag-icons/react/3x2';
import { US, DE, SE, FR, PT, JP, VN, PL, ES, IT, RO, TR, CN } from 'country-flag-icons/react/3x2';
import { SUPPORTED_LANGUAGES as LANGUAGES } from '@pelagica/i18n';

export interface SupportedLanguage {
    code: string;
    Flag: FlagComponent;
    label: string;
}

const FLAGS: Partial<Record<string, FlagComponent>> = {
    US,
    DE,
    SE,
    FR,
    PT,
    JP,
    VN,
    PL,
    ES,
    IT,
    RO,
    TR,
    CN,
};

// Languages whose flag isn't imported above are skipped so the picker never shows a blank flag
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = LANGUAGES.flatMap(
    ({ code, label, country }) => {
        const Flag = FLAGS[country];
        return Flag ? [{ code, Flag, label }] : [];
    }
);
