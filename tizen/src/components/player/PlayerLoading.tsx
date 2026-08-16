import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PlayerLoading = () => {
    const { t } = useTranslation('common');

    return (
        <div className="relative w-full h-svh bg-black flex items-center justify-center overflow-hidden">
            <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-secondary-foreground" />
                <p className="text-sm text-secondary-foreground">{t('loading')}</p>
            </div>
        </div>
    );
};

export default PlayerLoading;
