import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
    reportClientCapabilities,
    resolveRemotePlayItems,
    subscribeToRemoteControl,
    useCurrentUser,
} from '@pelagica/core';
import type {
    BaseItemKind,
    GeneralCommand,
    GeneralCommandType,
    PlayRequest,
    PlaystateRequest,
} from '@jellyfin/sdk/lib/generated-client/models';
import { useMusicPlayback } from '@/hooks/useMusicPlayback';
import type { MusicPlaybackContextType } from '@/context/MusicPlaybackContext';
import { toPlaybackTracks } from '@/utils/musicPlaybackTrack';
import { buildPlayerUrl } from '@/utils/playerUrl';
import { getItemUrl } from '@/utils/itemUrl';
import { getActiveVideoController } from './videoRemoteController';

const SEEK_STEP_SECONDS = 10;
const VOLUME_STEP = 5;

const SUPPORTED_COMMANDS: GeneralCommandType[] = [
    'Play',
    'PlayState',
    'PlayNext',
    'PlayMediaSource',
    'VolumeUp',
    'VolumeDown',
    'Mute',
    'Unmute',
    'ToggleMute',
    'SetVolume',
    'SetAudioStreamIndex',
    'SetSubtitleStreamIndex',
    'SetRepeatMode',
    'SetShuffleQueue',
    'ToggleFullscreen',
    'DisplayMessage',
    'DisplayContent',
    'GoHome',
    'GoToSettings',
    'GoToSearch',
];

export function RemoteControlManager() {
    const { data: currentUser, isError } = useCurrentUser();
    const userId = isError ? undefined : currentUser?.Id;
    const navigate = useNavigate();
    const music = useMusicPlayback();

    const musicRef = useRef<MusicPlaybackContextType>(music);
    const navigateRef = useRef(navigate);
    const mutedMusicVolumeRef = useRef<number | null>(null);

    useEffect(() => {
        musicRef.current = music;
        navigateRef.current = navigate;
    });

    useEffect(() => {
        if (!userId) return;

        reportClientCapabilities({
            playableMediaTypes: ['Audio', 'Video'],
            supportedCommands: SUPPORTED_COMMANDS,
        }).catch((error) => console.error('Failed to report client capabilities:', error));

        const isMusicActive = () => !!musicRef.current.currentTrack;

        const getMusicVolume = () => Math.round(musicRef.current.volume * 100);
        const setMusicVolume = (value: number) => {
            mutedMusicVolumeRef.current = null;
            musicRef.current.setVolume(Math.min(Math.max(value, 0), 100) / 100);
        };
        const setMusicMuted = (muted: boolean | 'toggle') => {
            const isMuted = mutedMusicVolumeRef.current !== null;
            const shouldMute = muted === 'toggle' ? !isMuted : muted;
            if (shouldMute === isMuted) return;

            if (shouldMute) {
                mutedMusicVolumeRef.current = musicRef.current.volume;
                musicRef.current.setVolume(0);
            } else {
                musicRef.current.setVolume(mutedMusicVolumeRef.current ?? 0.5);
                mutedMusicVolumeRef.current = null;
            }
        };

        const handlePlay = async (request: PlayRequest) => {
            try {
                const resolved = await resolveRemotePlayItems(request.ItemIds ?? []);
                const command = request.PlayCommand ?? 'PlayNow';

                if (resolved.kind === 'audio') {
                    const tracks = toPlaybackTracks(resolved.items);
                    const queueIsActive = musicRef.current.queue.length > 0;

                    if ((command === 'PlayNext' || command === 'PlayLast') && queueIsActive) {
                        musicRef.current.addToQueueEnd(tracks);
                        return;
                    }

                    // Leave the video player before the music starts
                    getActiveVideoController()?.stop();

                    if (command === 'PlayShuffle') {
                        musicRef.current.loadQueueShuffled(tracks, true);
                    } else {
                        const startIndex = Math.min(
                            Math.max(request.StartIndex ?? 0, 0),
                            tracks.length - 1
                        );
                        musicRef.current.loadQueue(tracks, startIndex, true);
                    }
                    return;
                }

                if (resolved.kind === 'video') {
                    const index =
                        command === 'PlayShuffle'
                            ? Math.floor(Math.random() * resolved.items.length)
                            : Math.min(
                                  Math.max(request.StartIndex ?? 0, 0),
                                  resolved.items.length - 1
                              );
                    const itemId = resolved.items[index].Id;
                    if (!itemId) return;

                    navigateRef.current(
                        buildPlayerUrl(itemId, undefined, request.StartPositionTicks ?? undefined)
                    );
                }
            } catch (error) {
                console.error('Failed to handle remote play request:', error);
            }
        };

        const handlePlaystate = (request: PlaystateRequest) => {
            const video = getActiveVideoController();
            const audio = musicRef.current;
            const seekTicks = request.SeekPositionTicks ?? 0;

            if (video) {
                switch (request.Command) {
                    case 'Pause':
                        return video.pause();
                    case 'Unpause':
                        return video.play();
                    case 'PlayPause':
                        return video.togglePlayPause();
                    case 'Stop':
                        return video.stop();
                    case 'Seek':
                        return video.seek(seekTicks);
                    case 'Rewind':
                        return video.seekBy(-SEEK_STEP_SECONDS);
                    case 'FastForward':
                        return video.seekBy(SEEK_STEP_SECONDS);
                    case 'NextTrack':
                        return video.next();
                    case 'PreviousTrack':
                        return video.previous();
                }
                return;
            }

            if (!isMusicActive()) return;

            switch (request.Command) {
                case 'Pause':
                    return audio.pause();
                case 'Unpause':
                    return audio.play();
                case 'PlayPause':
                    return audio.togglePlayPause();
                case 'Stop':
                    return audio.clearPlayback();
                case 'Seek':
                    return audio.seek(seekTicks);
                case 'Rewind':
                    return audio.seek(audio.currentTime - SEEK_STEP_SECONDS * 10_000_000);
                case 'FastForward':
                    return audio.seek(audio.currentTime + SEEK_STEP_SECONDS * 10_000_000);
                case 'NextTrack':
                    return audio.skipNext();
                case 'PreviousTrack':
                    return audio.skipPrevious();
            }
        };

        const handleGeneralCommand = (command: GeneralCommand) => {
            const args = command.Arguments ?? {};
            const video = getActiveVideoController();
            const audio = musicRef.current;

            const volumeTarget = video
                ? { get: video.getVolume, set: video.setVolume, mute: video.setMuted }
                : { get: getMusicVolume, set: setMusicVolume, mute: setMusicMuted };

            switch (command.Name) {
                case 'SetVolume': {
                    const volume = Number(args.Volume);
                    if (Number.isFinite(volume)) volumeTarget.set(volume);
                    return;
                }
                case 'VolumeUp':
                    return volumeTarget.set(volumeTarget.get() + VOLUME_STEP);
                case 'VolumeDown':
                    return volumeTarget.set(volumeTarget.get() - VOLUME_STEP);
                case 'Mute':
                    return volumeTarget.mute(true);
                case 'Unmute':
                    return volumeTarget.mute(false);
                case 'ToggleMute':
                    return volumeTarget.mute('toggle');
                case 'SetAudioStreamIndex': {
                    const index = Number(args.Index);
                    if (video && Number.isFinite(index)) video.setAudioStreamIndex(index);
                    return;
                }
                case 'SetSubtitleStreamIndex': {
                    const index = Number(args.Index);
                    if (video && Number.isFinite(index)) video.setSubtitleStreamIndex(index);
                    return;
                }
                case 'ToggleFullscreen':
                    return video?.toggleFullscreen();
                case 'SetRepeatMode':
                    return audio.setRepeat(args.RepeatMode !== 'RepeatNone');
                case 'SetShuffleQueue': {
                    const shouldShuffle = args.ShuffleMode === 'Shuffle';
                    if (shouldShuffle !== audio.shuffle) audio.toggleShuffle();
                    return;
                }
                case 'DisplayMessage': {
                    const header = args.Header || '';
                    const text = args.Text || '';
                    const timeout = Number(args.TimeoutMs);
                    const options =
                        Number.isFinite(timeout) && timeout > 0 ? { duration: timeout } : {};
                    if (header && text) toast(header, { ...options, description: text });
                    else if (header || text) toast(header || text, options);
                    return;
                }
                case 'DisplayContent':
                    if (args.ItemId) {
                        navigateRef.current(
                            getItemUrl(args.ItemType as BaseItemKind | undefined, args.ItemId)
                        );
                    }
                    return;
                case 'GoHome':
                    return navigateRef.current('/');
                case 'GoToSettings':
                    return navigateRef.current('/settings');
                case 'GoToSearch':
                    return navigateRef.current('/search');
            }
        };

        return subscribeToRemoteControl({
            onPlay: handlePlay,
            onPlaystate: handlePlaystate,
            onGeneralCommand: handleGeneralCommand,
        });
    }, [userId]);

    return null;
}
