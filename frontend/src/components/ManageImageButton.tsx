import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { useItemImages, type ItemImage } from '@/hooks/api/images/useItemImages';
import { useDeleteItemImage } from '@/hooks/api/images/useDeleteItemImage';
import { useSearchRemoteImages } from '@/hooks/api/images/useSearchRemoteImages';
import { useDownloadRemoteImage } from '@/hooks/api/images/useDownloadRemoteImage';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowLeft, Image, Loader2, PackageOpen, Search, Trash2, Upload } from 'lucide-react';
import type { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models';
import { getItemImageUrl } from '@/utils/jellyfinUrls';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useUploadItemImage } from '@/hooks/api/images/useUploadItemImage';
import FileDropInput from './FileDropInput';
import { getTmdbThumbnailUrl } from '../utils/tmdbThumbnails';

type ManageImagesPage = 'main' | 'upload' | 'find';

const imageTypes: ImageType[] = [
    'Primary',
    'Backdrop',
    'Logo',
    'Thumb',
    'Banner',
    'Art',
    'Disc',
    'Box',
    'Screenshot',
];

const imageTypeColumns: Record<ImageType, number> = {
    Primary: 3,
    Backdrop: 2,
    Logo: 2,
    Thumb: 2,
    Banner: 2,
    Art: 2,
    Disc: 3,
    Box: 2,
    Screenshot: 2,
    BoxRear: 0,
    Menu: 0,
    Chapter: 0,
    Profile: 0,
};

const findImageSkeletonConfig: Record<
    ImageType,
    {
        previewClassName: string;
        titleWidthClassName: string;
        subtitleWidthClassName: string;
    }
> = {
    Primary: {
        previewClassName: 'h-40 w-full rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Backdrop: {
        previewClassName: 'h-24 w-full rounded-none',
        titleWidthClassName: 'w-28',
        subtitleWidthClassName: 'w-16',
    },
    Logo: {
        previewClassName: 'mx-auto h-16 w-32 rounded-none',
        titleWidthClassName: 'w-20',
        subtitleWidthClassName: 'w-16',
    },
    Thumb: {
        previewClassName: 'mx-auto h-28 w-20 rounded-none',
        titleWidthClassName: 'w-20',
        subtitleWidthClassName: 'w-16',
    },
    Banner: {
        previewClassName: 'h-20 w-full rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Art: {
        previewClassName: 'mx-auto h-32 w-24 rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Disc: {
        previewClassName: 'mx-auto h-28 w-28 rounded-full',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Box: {
        previewClassName: 'mx-auto h-32 w-24 rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Screenshot: {
        previewClassName: 'h-24 w-full rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    BoxRear: {
        previewClassName: 'h-40 w-full rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Menu: {
        previewClassName: 'h-40 w-full rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Chapter: {
        previewClassName: 'h-40 w-full rounded-none',
        titleWidthClassName: 'w-24',
        subtitleWidthClassName: 'w-20',
    },
    Profile: {
        previewClassName: 'mx-auto h-24 w-24 rounded-full',
        titleWidthClassName: 'w-20',
        subtitleWidthClassName: 'w-16',
    },
};

const LazyImage = ({
    src,
    alt,
    className,
    root,
}: {
    src: string;
    alt: string;
    className?: string;
    root: Element | null;
}) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = imgRef.current;
        if (!el || !root) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { root, rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [root]);

    return <img ref={imgRef} src={isVisible ? src : undefined} alt={alt} className={className} />;
};

const FindImageResultsSkeleton = ({
    imageType,
    columnCount,
}: {
    imageType: ImageType;
    columnCount: number;
}) => {
    const skeletonConfig = findImageSkeletonConfig[imageType] || findImageSkeletonConfig.Primary;

    return (
        <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-accent animate-pulse" />
            <div
                className={`grid grid-cols-${columnCount} gap-4 max-h-[40vh] overflow-y-auto no-scrollbar`}
            >
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={`find-image-skeleton-${index}`} className="p-0 overflow-hidden">
                        <CardContent className="p-0 flex flex-col items-center h-full">
                            <div className="bg-muted flex w-full flex-1 items-center justify-center p-4">
                                <Skeleton
                                    className={`${skeletonConfig.previewClassName} ${imageType === 'Logo' ? 'bg-secondary/70' : ''} ${imageType === 'Thumb' ? 'bg-secondary/70' : ''}`}
                                />
                            </div>
                            <div className="bg-secondary w-full flex flex-col justify-center gap-2 p-2">
                                <Skeleton
                                    className={`h-4 ${skeletonConfig.titleWidthClassName} rounded`}
                                />
                                <Skeleton
                                    className={`h-3 ${skeletonConfig.subtitleWidthClassName} rounded`}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const MainPage = ({
    item,
    switchToPage,
}: {
    item: BaseItemDto;
    switchToPage: (page: ManageImagesPage) => void;
}) => {
    const { t } = useTranslation('item');
    const { data: images, isLoading, error } = useItemImages(item.Id!);
    const { deleteImage, isDeleting } = useDeleteItemImage();

    return (
        <>
            <div className="space-y-6 no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
                <h2 className="text-lg font-semibold mb-4">{t('manage_images')}</h2>

                {isLoading && (
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Card key={`skeleton-${index}`} className="p-0 overflow-hidden">
                                <CardContent className="p-0 flex flex-col items-center h-full relative bg-muted animate-pulse">
                                    <div className="w-full h-40 bg-muted" />
                                    <div className="bg-secondary w-full flex flex-col items-center justify-center p-2 space-y-2">
                                        <div className="h-4 w-20 bg-muted rounded" />
                                        <div className="h-3 w-24 bg-muted rounded" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                        Failed to load images: {error.message}
                    </div>
                )}

                {images && images.length === 0 && !isLoading && (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                        No images found for this item
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {images?.map((image: ItemImage) => (
                        <Card key={`${image.type}-${image.index}`} className="p-0 overflow-hidden">
                            <CardContent className="p-0 flex flex-col items-center h-full relative">
                                <img
                                    src={getItemImageUrl(
                                        item!.Id!,
                                        image.type,
                                        image.index,
                                        undefined,
                                        image.tag
                                    )}
                                    alt={`${image.type} ${image.index}`}
                                    className="object-contain max-h-25 my-auto"
                                />
                                <div className="bg-secondary w-full flex flex-col items-center justify-center p-2 ">
                                    <p>{image.type}</p>
                                    <p className="text-sm font-light text-muted-foreground">
                                        {image.size?.height} x {image.size?.width}
                                    </p>
                                </div>
                                <Button
                                    variant={'secondary'}
                                    size={'icon-sm'}
                                    className="absolute top-2 right-2 hover:bg-secondary"
                                    title={t('delete_image')}
                                    disabled={isDeleting}
                                    onClick={() =>
                                        deleteImage({
                                            itemId: item!.Id!,
                                            imageType: image.type,
                                            imageIndex: image.index,
                                        })
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <DialogFooter>
                <Button variant={'outline'} onClick={() => switchToPage('find')}>
                    <Search />
                    {t('find_images')}
                </Button>
                <Button variant={'outline'} onClick={() => switchToPage('upload')}>
                    <Upload />
                    {t('upload_new_image')}
                </Button>
            </DialogFooter>
        </>
    );
};

const FindImagePage = ({
    item,
    switchToPage,
}: {
    item: BaseItemDto;
    switchToPage: (page: ManageImagesPage) => void;
}) => {
    const { t } = useTranslation('item');
    const [selectedImageType, setSelectedImageType] = useState<ImageType>('Primary');
    const [includeAllLanguages, setIncludeAllLanguages] = useState(false);
    const [columnCount, setColumnCount] = useState(3);
    const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
    const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
    const { searchImages, isSearching, results } = useSearchRemoteImages();
    const { downloadImage } = useDownloadRemoteImage();

    const handleSearch = (imageType = selectedImageType, allLanguages = includeAllLanguages) => {
        searchImages({
            itemId: item.Id!,
            imageType,
            includeAllLanguages: allLanguages,
        });
        setColumnCount(imageTypeColumns[imageType] || 3);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center mb-4">
                <Button variant={'ghost'} size={'icon-sm'} onClick={() => switchToPage('main')}>
                    <ArrowLeft className="cursor-pointer" />
                </Button>
                <h2 className="text-lg font-semibold ml-2">{t('find_images')}</h2>
            </div>

            {isSearching && !results ? (
                <FindImageResultsSkeleton imageType={selectedImageType} columnCount={columnCount} />
            ) : results && results.length > 0 ? (
                <div className="space-y-2">
                    <h3 className="font-medium">
                        {t('results')} ({results.length})
                    </h3>
                    <div
                        ref={setScrollContainer}
                        className={`grid grid-cols-${columnCount} gap-4 max-h-[40vh] overflow-y-auto no-scrollbar`}
                    >
                        {results.map((image, index) => (
                            <Card
                                key={index}
                                className="p-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                                role="button"
                                onClick={() => {
                                    setDownloadingIndex(index);
                                    downloadImage(
                                        {
                                            itemId: item.Id!,
                                            imageType: selectedImageType,
                                            imageUrl: image.Url!,
                                        },
                                        {
                                            onSettled: () => {
                                                setDownloadingIndex(null);
                                                switchToPage('main');
                                            },
                                        }
                                    );
                                }}
                            >
                                {downloadingIndex === index && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                )}
                                <CardContent className="p-0 flex flex-col items-center h-full">
                                    <LazyImage
                                        src={getTmdbThumbnailUrl(image.Url || '', image.Type)}
                                        alt={`Result ${index}`}
                                        className="object-contain w-full my-auto"
                                        root={scrollContainer}
                                    />
                                    <div className="bg-secondary w-full flex flex-col justify-center text-center gap-1 p-1">
                                        {image.ProviderName && <p>{image.ProviderName}</p>}
                                        {image.Height && image.Width && (
                                            <p className="text-sm font-light text-muted-foreground">
                                                {image.Height} x {image.Width}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : null}

            {results && results.length === 0 && !isSearching && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <PackageOpen />
                    {t('no_results_found')}
                </div>
            )}

            <div className="flex items-center gap-4">
                <Select
                    value={selectedImageType}
                    onValueChange={(value) => {
                        const nextImageType = value as ImageType;
                        setSelectedImageType(nextImageType);
                        handleSearch(nextImageType, includeAllLanguages);
                    }}
                >
                    <SelectTrigger className="grow">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {imageTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="all-languages"
                        checked={includeAllLanguages}
                        onCheckedChange={(checked) => {
                            setIncludeAllLanguages(checked);
                            handleSearch(selectedImageType, checked);
                        }}
                    />
                    <Label htmlFor="all-languages" className="cursor-pointer">
                        {t('include_all_languages')}
                    </Label>
                </div>
            </div>
        </div>
    );
};

const UploadImagePage = ({
    item,
    switchToPage,
}: {
    item: BaseItemDto;
    switchToPage: (page: ManageImagesPage) => void;
}) => {
    const { t } = useTranslation('item');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedImageType, setSelectedImageType] = useState<ImageType>('Primary');
    const { uploadImage, isUploading } = useUploadItemImage();

    return (
        <div className="space-y-6">
            <div className="flex items-center mb-4">
                <Button variant={'ghost'} size={'icon-sm'} onClick={() => switchToPage('main')}>
                    <ArrowLeft className="cursor-pointer" />
                </Button>
                <h2 className="text-lg font-semibold ml-2">{t('upload_image')}</h2>
            </div>

            <FileDropInput
                value={selectedFile}
                onChange={(file) => setSelectedFile(file)}
                accept="image/*"
                disabled={isUploading}
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                    defaultValue="Primary"
                    onValueChange={(value) => setSelectedImageType(value as ImageType)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {imageTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    className="grow"
                    onClick={() => {
                        if (selectedFile) {
                            uploadImage({
                                itemId: item.Id!,
                                imageType: selectedImageType,
                                file: selectedFile,
                                onSuccess: () => switchToPage('main'),
                            });
                        }
                    }}
                    disabled={!selectedFile || isUploading}
                >
                    {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
                    {isUploading ? t('uploading') : t('upload')}
                </Button>
            </div>
        </div>
    );
};

const ManageImageButton = ({
    showButton,
    trigger,
    item,
}: {
    showButton?: boolean;
    trigger?: React.ReactNode;
    item?: BaseItemDto;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: currentUser } = useCurrentUser();
    const [page, setPage] = useState<ManageImagesPage>('main');

    if (showButton === false) return null;
    if (currentUser?.Policy?.IsAdministrator !== true) return null;
    if (!item) return null;

    const onOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setPage('main');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button variant={'outline'} size={'icon'}>
                        <Image />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                {page === 'main' && <MainPage item={item} switchToPage={setPage} />}
                {page === 'find' && <FindImagePage item={item} switchToPage={setPage} />}
                {page === 'upload' && <UploadImagePage item={item} switchToPage={setPage} />}
            </DialogContent>
        </Dialog>
    );
};

export default ManageImageButton;
