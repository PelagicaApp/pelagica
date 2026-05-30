import { usePageBackground } from '@/hooks/usePageBackground';
import { getBackdropUrl, getLogoUrl } from '@/utils/jellyfinUrls';
import { useEffect, useState } from 'react';

interface BaseMediaPageProps {
    itemId: string;
    name?: string;
    children?: React.ReactNode;
    showLogo?: boolean;
    topPadding?: boolean;
    logo?: React.ReactNode;
}

const BaseMediaPage = ({
    itemId,
    name,
    children,
    showLogo = true,
    topPadding = true,
    logo,
}: BaseMediaPageProps) => {
    const { setBackground } = usePageBackground();
    const [failedBackdrop, setFailedBackdrop] = useState(false);
    const [failedLogo, setFailedLogo] = useState(false);

    useEffect(() => {
        setBackground(
            <div className="fixed top-0 left-0 w-full h-full -z-20 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={getBackdropUrl(itemId || '')}
                        alt={name + ' Backdrop'}
                        className="w-full h-full object-cover blur-3xl scale-110 opacity-40"
                    />
                </div>
                <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/50 to-background" />
                <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
            </div>
        );

        return () => {
            setBackground(null);
        };
    }, [itemId, name, setBackground]);

    return (
        <div className="relative">
            <div className="absolute top-0 left-0 h-[calc(75dvh-2rem)] w-full -z-10">
                {!failedBackdrop && (
                    <img
                        className="h-full w-full object-cover rounded-md border border-border"
                        src={getBackdropUrl(itemId || '')}
                        alt={name + ' Backdrop'}
                        onError={() => setFailedBackdrop(true)}
                    />
                )}
                {failedBackdrop && (
                    <div className="h-full w-full rounded-md border border-border" />
                )}
                <div className="absolute bottom-0 left-0 h-full w-full px-4 bg-linear-to-t from-background to-transparent rounded-md" />
            </div>
            {topPadding && (
                <div className="h-[calc(45dvh-2rem)] flex items-center justify-center">
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
            <div className={`relative z-10 p-2 sm:p-4 ${topPadding ? '' : 'min-h-full flex'}`}>
                <div
                    className={`bg-background/30 backdrop-blur-md p-4 sm:p-8 rounded-md w-full flex flex-col gap-8 ${topPadding ? '' : 'flex-1'}`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BaseMediaPage;
