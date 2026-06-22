import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models';
import {
    Clapperboard,
    MonitorPlay,
    Music,
    Video,
    Camera,
    Tv,
    ListMusic,
    BookOpen,
    Image,
    Film,
    Folder,
    Archive,
} from 'lucide-react';

const JellyfinLibraryIcon = ({ libraryType }: { libraryType: CollectionType | undefined }) => {
    switch (libraryType) {
        case 'movies':
            return <Clapperboard />;

        case 'tvshows':
            return <MonitorPlay />;

        case 'music':
            return <Music />;

        case 'boxsets':
            return <Archive />;

        case 'musicvideos':
            return <Video />;

        case 'homevideos':
            return <Camera />;

        case 'livetv':
            return <Tv />;

        case 'playlists':
            return <ListMusic />;

        case 'books':
            return <BookOpen />;

        case 'photos':
            return <Image />;

        case 'trailers':
            return <Film />;

        default:
            return <Folder />;
    }
};

export default JellyfinLibraryIcon;
