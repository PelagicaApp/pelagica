import type { SectionItemsConfig } from '@/hooks/api/useConfig';

export function buildSectionItemsLink(
    title: string | undefined,
    config: SectionItemsConfig | undefined
): string {
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (config) params.set('config', btoa(encodeURIComponent(JSON.stringify(config))));
    return `/items/section?${params.toString()}`;
}

export function parseSectionItemsLink(searchParams: URLSearchParams): {
    title?: string;
    config?: SectionItemsConfig;
} {
    const title = searchParams.get('title') ?? undefined;
    const encoded = searchParams.get('config');
    if (!encoded) return { title };

    try {
        return { title, config: JSON.parse(decodeURIComponent(atob(encoded))) };
    } catch {
        return { title };
    }
}
