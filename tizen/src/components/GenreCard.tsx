import { getPrimaryImageUrl, type GenreWithItem } from '@pelagica/core';
import { useState } from 'react';
import FocusableCard from './FocusableCard';
import { getItemLink } from '../lib/getItemLink';
import { cn } from '../lib/utils';
import { FOCUS_RING_LARGE } from '../lib/focus-styles';
import { useTranslation } from 'react-i18next';
import { ImageOff } from 'lucide-react';

interface GenresCardProps {
    genreWithItem: GenreWithItem;
    autoFocus?: boolean;
    className?: string;
}

const GenreCard = ({ genreWithItem, autoFocus, className }: GenresCardProps) => {
    const { t } = useTranslation('item');
    const [posterError, setPosterError] = useState(false);
    const posterUrl = getPrimaryImageUrl(genreWithItem.item?.Id || '', {
        maxWidth: 416,
        maxHeight: 640,
    });

    return (
        <FocusableCard
            to={getItemLink('Genre', genreWithItem.id)}
            className={cn(className ? className : 'w-60')}
            autoFocus={autoFocus}
        >
            {(focused) => (
                <>
                    <div
                        className={cn(
                            'aspect-video w-full relative overflow-hidden rounded-md border border-border bg-muted',
                            focused && FOCUS_RING_LARGE
                        )}
                    >
                        {posterError || !posterUrl ? (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                {/* Hidden img purely for error detection, keeps onError working */}
                                <img
                                    src={posterUrl}
                                    alt=""
                                    className="hidden"
                                    onError={() => setPosterError(true)}
                                />
                                <div
                                    role="img"
                                    aria-label={genreWithItem.item?.Name || t('unknown_item')}
                                    className="absolute inset-0 w-full h-full grayscale transition-all group-hover:scale-105 group-hover:opacity-75"
                                    style={{
                                        backgroundImage: `linear-gradient(to top, rgb(0 0 0 / 0.8), rgb(0 0 0 / 0.4), transparent), url(${posterUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundBlendMode: 'normal',
                                    }}
                                />
                            </>
                        )}
                        <div
                            className="absolute inset-0 rounded-md z-10"
                            style={{
                                backgroundColor: genreWithItem.tint,
                                opacity: 0.35,
                            }}
                        />
                        <div className="absolute bottom-2 left-2 right-2 z-30">
                            <p
                                className={`text-2xl font-semibold text-gray-300 drop-shadow line-clamp-2`}
                            >
                                {genreWithItem.name}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </FocusableCard>
    );
};

export default GenreCard;
