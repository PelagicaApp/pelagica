import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Page from '../Page';
import { useItem } from '../../hooks/api/useItem';
import { getUserId } from '../../utils/localstorageCredentials';
import { getPrimaryImageUrl } from '../../utils/jellyfinUrls';
import { useNavigate, useParams } from 'react-router';
import { Spinner } from '../../components/ui/spinner';

const AUTOHIDE_MS = 2500;

const PhotoViewerPage = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const navigate = useNavigate();

    const { data: item, isLoading, error } = useItem(itemId, true, getUserId() || undefined);

    const [showControls, setShowControls] = useState(true);
    const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetHide = useCallback(() => {
        setShowControls(true);
        if (hideTimeout.current) clearTimeout(hideTimeout.current);

        hideTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, AUTOHIDE_MS);
    }, []);

    useEffect(() => {
        hideTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, AUTOHIDE_MS);

        return () => {
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
        };
    }, []);

    const handleBack = () => navigate(-1);

    const imgUrl = item ? getPrimaryImageUrl(item.Id!) : null;

    return (
        <Page title={item?.Name || 'Photo Viewer'}>
            <div
                className="absolute inset-0 top-18 flex items-center justify-center overflow-hidden"
                onMouseMove={resetHide}
                onClick={resetHide}
            >
                {/* IMAGE */}
                {imgUrl && (
                    <img
                        src={imgUrl}
                        alt={item?.Name || 'Photo'}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                        }}
                        className="select-none"
                    />
                )}

                {isLoading && (
                    <div className="absolute">
                        <Spinner className="size-6 text-muted-foreground" />
                    </div>
                )}

                {error && <div className="absolute text-red-400">Error loading image</div>}

                {/* TOP BAR */}
                <div
                    className="absolute top-0 left-0 right-0 px-4 flex items-center gap-2 text-white transition-opacity z-100"
                    style={{
                        opacity: showControls ? 1 : 0,
                        pointerEvents: showControls ? 'auto' : 'none',
                    }}
                >
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft />
                    </Button>
                    <span className="text-sm">{item?.Name}</span>
                </div>

                {/* CENTER NAV */}
                {/* <div
                    className="absolute inset-0 px-4 flex items-center justify-between text-white z-10"
                    style={{
                        opacity: showControls ? 1 : 0,
                        pointerEvents: showControls ? 'auto' : 'none',
                    }}
                >
                    <Button variant="ghost" size="icon-lg">
                        <ChevronLeft />
                    </Button>
                    <Button variant="ghost" size="icon-lg">
                        <ChevronRight />
                    </Button>
                </div> */}
            </div>
        </Page>
    );
};

export default PhotoViewerPage;
