import { getBackdropUrl, getLogoUrl } from '@/utils/jellyfinUrls';
import { useState } from 'react';

interface BaseMediaPageProps {
    itemId: string;
    name?: string;
    children?: React.ReactNode;
    showLogo?: boolean;
    topPadding?: boolean;
    topPaddingMinHeight?: string;
    logo?: React.ReactNode;
}

const BaseMediaPage = ({
    itemId,
    name,
    children,
    showLogo = true,
    topPadding = true,
    topPaddingMinHeight = '45dvh',
    logo,
}: BaseMediaPageProps) => {
    const [failedBackdrop, setFailedBackdrop] = useState(false);
    const [failedLogo, setFailedLogo] = useState(false);
    const [isBgLoaded, setIsBgLoaded] = useState(false);
    const [prevItemId, setPrevItemId] = useState(itemId);

    if (itemId !== prevItemId) {
        setPrevItemId(itemId);
        setIsBgLoaded(false);
    }

    return (
        <div className="relative">
            <div className="absolute top-0 left-0 h-[75vh] md:h-[85vh] w-full -z-10 overflow-hidden pointer-events-none select-none">
                {!failedBackdrop && (
                    <div className="relative w-full h-full">
                        <img
                            className={[
                                'h-full w-full object-cover',
                                'transition-[filter,opacity] duration-700 ease-out',
                                isBgLoaded ? 'blur-0 opacity-45' : 'blur-lg opacity-0',
                            ].join(' ')}
                            src={getBackdropUrl(itemId || '')}
                            alt={name + ' Backdrop'}
                            onLoad={() => setIsBgLoaded(true)}
                            onError={() => setFailedBackdrop(true)}
                        />
                        {/* Left-to-right dark fade to ensure text readability */}
                        <div className="absolute inset-0 bg-linear-to-r from-background via-background/75 to-transparent" />
                        {/* Bottom-to-top fade to background */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-background via-background/85 to-transparent" />
                    </div>
                )}
                {failedBackdrop && <div className="h-full w-full bg-background" />}
                {!isBgLoaded && !failedBackdrop && (
                    <div className="absolute inset-0 bg-muted/10 animate-pulse" />
                )}
            </div>
            {topPadding && (
                <div
                    className={`flex items-center justify-center`}
                    style={{ minHeight: `calc(${topPaddingMinHeight} - 2rem)` }}
                >
                    {showLogo && !failedLogo && (
                        <>
                            {logo || (
                                <img
                                    src={getLogoUrl(itemId || '')}
                                    alt={name + ' Logo'}
                                    className="relative mx-auto px-4 h-32 object-contain"
                                    onError={() => setFailedLogo(true)}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
            <div
                className={`relative z-10 px-4 sm:px-12 pb-12 pt-6 ${topPadding ? '' : 'min-h-full flex'}`}
            >
                <div className={`w-full flex flex-col gap-8 ${topPadding ? '' : 'flex-1'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BaseMediaPage;
