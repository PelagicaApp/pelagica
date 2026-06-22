import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MusicBackButton = () => {
    const { t } = useTranslation('music');

    return (
        <Link
            to="/music"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit py-2"
        >
            <ArrowLeft className="w-4 h-4" />
            {t('back_to_music')}
        </Link>
    );
};

export default MusicBackButton;
