import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { Resource } from 'i18next';

const localeModules = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/*.json', {
    eager: true,
});

const resources: Resource = {};
const namespaces = new Set<string>();

for (const [path, module] of Object.entries(localeModules)) {
    const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
    if (match) {
        const [, language, namespace] = match;
        if (!resources[language]) {
            resources[language] = {};
        }
        (resources[language] as Record<string, unknown>)[namespace] = module.default;
        namespaces.add(namespace);
    }
}

const nsList = Array.from(namespaces).sort();

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        ns: nsList,
        defaultNS: 'common',
        interpolation: { escapeValue: false, formatSeparator: ',' },
        react: {
            useSuspense: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
