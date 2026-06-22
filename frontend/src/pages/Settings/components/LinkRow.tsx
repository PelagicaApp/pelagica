import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUp, ArrowDown, Link2 } from 'lucide-react';
import { IconPicker, type IconName } from '@/components/ui/icon-picker';
import { DynamicIcon } from 'lucide-react/dynamic';
import type { ConfigLink } from '@/hooks/api/useConfig';
import { DebouncedInput } from './SettingsInputs';

export const LinkRow = ({
    link,
    onChange,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: {
    link: ConfigLink;
    onChange: (link: ConfigLink) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}) => {
    const { t } = useTranslation('settings');

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
                <IconPicker
                    value={(link.icon || undefined) as IconName | undefined}
                    onValueChange={(value) => onChange({ ...link, icon: value })}
                    searchPlaceholder={t('link_icon_search_placeholder')}
                    triggerPlaceholder={t('link_icon_placeholder')}
                    showCategoryButtons={false}
                >
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label={t('link_icon_label')}
                    >
                        {link.icon ? (
                            <DynamicIcon name={link.icon as IconName} className="h-4 w-4" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                    </Button>
                </IconPicker>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <DebouncedInput
                        value={link.text}
                        onChange={(value) => onChange({ ...link, text: value })}
                        placeholder={t('link_text_placeholder')}
                    />
                    <DebouncedInput
                        value={link.url}
                        onChange={(value) => onChange({ ...link, url: value })}
                        placeholder={t('link_url_placeholder')}
                    />
                </div>

                <div className="flex items-center gap-1">
                    <Button onClick={onMoveUp} variant="ghost" size="sm" disabled={!canMoveUp}>
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button onClick={onMoveDown} variant="ghost" size="sm" disabled={!canMoveDown}>
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onDelete}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
