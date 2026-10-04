import i18n from 'i18next';

export interface AboutTranslationStrings {
    about: string;
    tagline: string;
    releases: string;
    issues: string;
    credits: string;
    platform_desktop: string;
    platform_web: string;
}

export const aboutTranslations: Record<string, AboutTranslationStrings> = {
    en: {
        about: 'About Pelagica',
        tagline: 'A modern, beautiful media client for Jellyfin.',
        releases: 'Releases',
        issues: 'Report Issue',
        credits: 'Crafted for the Jellyfin community.',
        platform_desktop: 'Desktop',
        platform_web: 'Web',
    },
    tr: {
        about: 'Pelagica Hakkında',
        tagline: 'Jellyfin için modern ve şık bir medya istemcisi.',
        releases: 'Sürümler',
        issues: 'Hata Bildir',
        credits: 'Jellyfin topluluğu için sevgiyle geliştirildi.',
        platform_desktop: 'Masaüstü',
        platform_web: 'Web',
    },
    de: {
        about: 'Über Pelagica',
        tagline: 'Ein moderner, schöner Medien-Client für Jellyfin.',
        releases: 'Releases',
        issues: 'Problem melden',
        credits: 'Entwickelt für die Jellyfin-Community.',
        platform_desktop: 'Desktop',
        platform_web: 'Web',
    },
    fr: {
        about: 'À propos de Pelagica',
        tagline: 'Un client média moderne et élégant pour Jellyfin.',
        releases: 'Versions',
        issues: 'Signaler un problème',
        credits: 'Créé pour la communauté Jellyfin.',
        platform_desktop: 'Bureau',
        platform_web: 'Web',
    },
    es: {
        about: 'Acerca de Pelagica',
        tagline: 'Un cliente multimedia moderno y elegante para Jellyfin.',
        releases: 'Versiones',
        issues: 'Informar de un problema',
        credits: 'Creado para la comunidad de Jellyfin.',
        platform_desktop: 'Escritorio',
        platform_web: 'Web',
    },
    it: {
        about: 'Informazioni su Pelagica',
        tagline: 'Un client multimediale moderno ed elegante per Jellyfin.',
        releases: 'Versioni',
        issues: 'Segnala un problema',
        credits: 'Creato per la comunità Jellyfin.',
        platform_desktop: 'Desktop',
        platform_web: 'Web',
    },
    pt: {
        about: 'Sobre o Pelagica',
        tagline: 'Um cliente de mídia moderno e bonito para Jellyfin.',
        releases: 'Versões',
        issues: 'Relatar problema',
        credits: 'Desenvolvido para a comunidade Jellyfin.',
        platform_desktop: 'Desktop',
        platform_web: 'Web',
    },
    pl: {
        about: 'O aplikacji Pelagica',
        tagline: 'Nowoczesny, piękny klient multimedialny dla Jellyfin.',
        releases: 'Wydania',
        issues: 'Zgłoś problem',
        credits: 'Stworzone dla społeczności Jellyfin.',
        platform_desktop: 'Pulpit',
        platform_web: 'Sieć',
    },
    sv: {
        about: 'Om Pelagica',
        tagline: 'En modern och vacker medieklient för Jellyfin.',
        releases: 'Versioner',
        issues: 'Rapportera problem',
        credits: 'Skapad för Jellyfin-gemenskapen.',
        platform_desktop: 'Skrivbord',
        platform_web: 'Webb',
    },
    ro: {
        about: 'Despre Pelagica',
        tagline: 'Un client media modern și elegant pentru Jellyfin.',
        releases: 'Versiuni',
        issues: 'Raportează o problemă',
        credits: 'Creat pentru comunitatea Jellyfin.',
        platform_desktop: 'Desktop',
        platform_web: 'Web',
    },
    ja: {
        about: 'Pelagica について',
        tagline: 'Jellyfin 向けのモダンで美しいメディアクライアント。',
        releases: 'リリース',
        issues: '問題を報告',
        credits: 'Jellyfin コミュニティのために作成されました。',
        platform_desktop: 'デスクトップ',
        platform_web: 'ウェブ',
    },
    vi: {
        about: 'Về Pelagica',
        tagline: 'Trình phát đa phương tiện hiện đại và đẹp mắt cho Jellyfin.',
        releases: 'Phiên bản',
        issues: 'Báo cáo sự cố',
        credits: 'Được tạo cho cộng đồng Jellyfin.',
        platform_desktop: 'Máy tính để bàn',
        platform_web: 'Web',
    },
    zh: {
        about: '关于 Pelagica',
        tagline: '专为 Jellyfin 打造的现代优雅媒体客户端。',
        releases: '发布版本',
        issues: '反馈问题',
        credits: '为 Jellyfin 社区精心打造。',
        platform_desktop: '桌面端',
        platform_web: '网页端',
    },
};

// Register resource bundles into i18next
for (const [lang, translations] of Object.entries(aboutTranslations)) {
    i18n.addResourceBundle(lang, 'about', translations, true, true);
    i18n.addResourceBundle(lang, 'sidebar', { about: translations.about }, true, false);
}

export default aboutTranslations;
