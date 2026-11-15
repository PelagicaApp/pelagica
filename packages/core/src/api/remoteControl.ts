import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';
import type {
    BaseItemDto,
    GeneralCommand,
    GeneralCommandType,
    MediaType,
    PlayRequest,
    PlaystateRequest,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getApi } from './getApi';

const AUDIO_ITEM_TYPES = new Set(['Audio', 'AudioBook']);

const VIDEO_ITEM_TYPES = new Set([
    'Movie',
    'Episode',
    'Video',
    'MusicVideo',
    'TvChannel',
    'Trailer',
    'Program',
    'Recording',
]);

export interface RemoteControlHandlers {
    onPlay?: (request: PlayRequest) => void;
    onPlaystate?: (request: PlaystateRequest) => void;
    onGeneralCommand?: (command: GeneralCommand) => void;
}

/**
 * Tells the server what this client can do, so it shows up as a controllable
 * session (the cast/remote-control menu) in other Jellyfin clients.
 */
export async function reportClientCapabilities(options: {
    playableMediaTypes: MediaType[];
    supportedCommands: GeneralCommandType[];
}) {
    const sessionApi = getSessionApi(getApi());
    await sessionApi.postFullCapabilities({
        clientCapabilitiesDto: {
            PlayableMediaTypes: options.playableMediaTypes,
            SupportedCommands: options.supportedCommands,
            SupportsMediaControl: true,
            SupportsPersistentIdentifier: true,
        },
    });
}

export function subscribeToRemoteControl(handlers: RemoteControlHandlers): () => void {
    const api = getApi();

    const unsubscribers = [
        api.subscribe([OutboundWebSocketMessageType.Play], (message) => {
            if (message.Data) handlers.onPlay?.(message.Data);
        }),
        api.subscribe([OutboundWebSocketMessageType.Playstate], (message) => {
            if (message.Data) handlers.onPlaystate?.(message.Data);
        }),
        api.subscribe([OutboundWebSocketMessageType.GeneralCommand], (message) => {
            if (message.Data) handlers.onGeneralCommand?.(message.Data);
        }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export type ResolvedRemotePlayItems =
    | { kind: 'video'; items: BaseItemDto[] }
    | { kind: 'audio'; items: BaseItemDto[] }
    | { kind: 'none' };

export async function resolveRemotePlayItems(itemIds: string[]): Promise<ResolvedRemotePlayItems> {
    if (itemIds.length === 0) return { kind: 'none' };

    const libraryApi = getLibraryApi(getApi());
    const { data } = await libraryApi.getItems({ ids: itemIds });

    const byId = new Map((data.Items ?? []).map((item) => [item.Id, item]));
    let items = itemIds.map((id) => byId.get(id)).filter((item): item is BaseItemDto => !!item);

    if (items.length === 1 && items[0].IsFolder) {
        const parent = items[0];
        const { data: children } = await libraryApi.getItems({
            parentId: parent.Id!,
            recursive: true,
            mediaTypes: ['Audio', 'Video'],
            sortBy:
                parent.Type === 'Playlist'
                    ? ['Default']
                    : ['ParentIndexNumber', 'IndexNumber', 'SortName'],
            sortOrder: ['Ascending'],
        });
        items = children.Items ?? [];
    }

    if (items.length === 0) return { kind: 'none' };

    const first = items[0];
    if (first.Type && AUDIO_ITEM_TYPES.has(first.Type)) {
        return {
            kind: 'audio',
            items: items.filter((item) => item.Type && AUDIO_ITEM_TYPES.has(item.Type)),
        };
    }
    if ((first.Type && VIDEO_ITEM_TYPES.has(first.Type)) || first.MediaType === 'Video') {
        return { kind: 'video', items };
    }

    return { kind: 'none' };
}
