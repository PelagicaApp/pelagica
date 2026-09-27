import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18nextOptions } from '@pelagica/i18n';

export * from './supportedLanguages';

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        ...i18nextOptions,
        react: {
            useSuspense: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
