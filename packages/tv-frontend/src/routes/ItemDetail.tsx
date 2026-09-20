import { useState } from 'react';
import { useNavigate, useParams } from '@/router';
import {
    getDownloadurl,
    getPrimaryImageUrl,
    getUserId,
    isLibraryContainer,
    useCurrentUser,
    useItem,
} from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download } from 'lucide-react';
import FocusableButton from '../components/FocusableButton';
import ItemContents from '../components/ItemContents';
import ItemHero from '../components/ItemHero';
import PlayButton from '../components/PlayButton';

const ItemDetail = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(['item', 'common']);
    const { data: item, isLoading } = useItem(itemId, true, getUserId() ?? undefined);
    const { data: user } = useCurrentUser();
    const [imageError, setImageError] = useState(false);
    const isContainer =
        !!item &&
        (item.IsFolder ||
            isLibraryContainer(item.Type) ||
            item.Type === 'MusicAlbum' ||
            item.Type === 'MusicArtist' ||
            item.Type === 'Playlist' ||
            item.Type === 'Season');
    const isPhoto = item?.Type === 'Photo';
    const canPlay =
        !!item &&
        !isContainer &&
        (item.Type === 'Video' ||
            item.Type === 'Episode' ||
            item.Type === 'Trailer' ||
            item.Type === 'MusicVideo' ||
            item.Type === 'TvChannel' ||
            item.Type === 'LiveTvChannel' ||
            item.Type === 'Recording' ||
            (item.MediaType === 'Video' && item.Type !== 'Program'));
    const isDownloadable =
        !!item &&
        !isContainer &&
        item.Type !== 'TvChannel' &&
        item.Type !== 'LiveTvChannel' &&
        item.Type !== 'Program' &&
        (item.CanDownload === true ||
            item.Type === 'Book' ||
            item.Type === 'Audio' ||
            item.Type === 'AudioBook' ||
            isPhoto ||
            canPlay ||
            !!item.MediaSources?.length);
    const canDownload =
        isDownloadable &&
        !!user &&
        user.Policy?.EnableContentDownloading === true &&
        item?.CanDownload !== false;
    const downloadUrl = canDownload && item?.Id ? getDownloadurl(item.Id) : '';
    const actions = (
        <>
            {canPlay && item && <PlayButton item={item} />}
            {downloadUrl && (
                <FocusableButton
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<a href={downloadUrl} target="_blank" rel="noopener noreferrer" />}
                >
                    <Download /> {t('download_original_file')}
                </FocusableButton>
            )}
            <FocusableButton
                autoFocus={!canPlay}
                size="lg"
                variant="outline"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft /> {t('common:back')}
            </FocusableButton>
        </>
    );

    if (!isLoading && !item) {
        return (
            <div className="flex flex-col items-start gap-6">
                <p role="alert">{t('item_not_found')}</p>
                <FocusableButton autoFocus onClick={() => navigate(-1)}>
                    <ArrowLeft /> {t('common:back')}
                </FocusableButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {isPhoto && item?.Id ? (
                <>
                    <h1 className="text-2xl font-semibold">{item.Name}</h1>
                    {imageError ? (
                        <p role="alert" className="text-muted-foreground">
                            {t('item_not_found')}
                        </p>
                    ) : (
                        <img
                            src={getPrimaryImageUrl(
                                item.Id,
                                undefined,
                                item.ImageTags?.Primary,
                                100
                            )}
                            alt={item.Name ?? t('image')}
                            className="max-h-[70vh] w-full object-contain"
                            onError={() => setImageError(true)}
                        />
                    )}
                    <div className="flex flex-wrap gap-3">{actions}</div>
                </>
            ) : (
                <ItemHero item={item} isLoading={isLoading} mainButtonRow={actions} />
            )}
            {item && (
                <>
                    {!isContainer && !isPhoto && !canPlay && (
                        <p className="text-muted-foreground">{t('playback_unavailable')}</p>
                    )}
                    {isDownloadable && user && !canDownload && (
                        <p className="text-muted-foreground">{t('download_unavailable')}</p>
                    )}
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
                        {item.Overview && (
                            <>
                                <dt className="text-muted-foreground">{t('overview')}</dt>
                                <dd className="whitespace-pre-line">{item.Overview}</dd>
                            </>
                        )}
                        {!!item.People?.length && (
                            <>
                                <dt className="text-muted-foreground">{t('people')}</dt>
                                <dd>
                                    {item.People.map((person) => person.Name)
                                        .filter(Boolean)
                                        .join(', ')}
                                </dd>
                            </>
                        )}
                        {!!item.Artists?.length && (
                            <>
                                <dt className="text-muted-foreground">{t('common:artist')}</dt>
                                <dd>{item.Artists.join(', ')}</dd>
                            </>
                        )}
                        {item.Album && (
                            <>
                                <dt className="text-muted-foreground">{t('common:album')}</dt>
                                <dd>{item.Album}</dd>
                            </>
                        )}
                        {item.ProductionYear && (
                            <>
                                <dt className="text-muted-foreground">{t('release_year')}</dt>
                                <dd>{item.ProductionYear}</dd>
                            </>
                        )}
                        {!!item.ProviderIds && Object.keys(item.ProviderIds).length > 0 && (
                            <>
                                <dt className="text-muted-foreground">{t('external_ids')}</dt>
                                <dd>
                                    {Object.entries(item.ProviderIds)
                                        .map(([provider, id]) => `${provider}: ${id}`)
                                        .join(' · ')}
                                </dd>
                            </>
                        )}
                    </dl>
                    {isContainer && <ItemContents key={item.Id} item={item} />}
                </>
            )}
        </div>
    );
};

export default ItemDetail;
