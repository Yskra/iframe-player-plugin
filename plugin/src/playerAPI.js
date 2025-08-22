/** @import {Ref, MaybeRefOrGetter} from 'vue'; */
import { createEventHook, watchIgnorable } from 'utils';
import { computed, ref, shallowRef, toValue } from 'vue';

/**
 * Wrap PlayerJS iframe API to useMediaControls-like API
 * @param {MaybeRefOrGetter<HTMLIFrameElement>} iframe
 */
export function usePlayerAPI(iframe) {
  iframe = toValue(iframe);

  const sourceLoadedEvent = createEventHook();
  const playerIsReadyEvent = createEventHook();
  const sourceErrorEvent = createEventHook();
  const playbackErrorEvent = createEventHook();

  window.addEventListener('message', messageListener);

  iframe.addEventListener('load', async (event) => {
    await sourceLoadedEvent.trigger(event);
  });

  const currentTime = shallowRef(0);
  const duration = shallowRef(0);
  const seeking = shallowRef(false);
  const volume = shallowRef(1);
  const waiting = shallowRef(false);
  const ended = shallowRef(false);
  const playing = shallowRef(false);
  const rate = shallowRef(1);
  const stalled = shallowRef(false);
  /** @type {Ref<[number, number][]>} */
  const buffered = ref([]);
  const tracks = ref([]);
  const selectedTrack = shallowRef(-1);
  const isPictureInPicture = shallowRef(false);
  const muted = shallowRef(false);
  const loop = shallowRef(false);
  const qualities = ref([]);
  const quality = shallowRef(0);
  const audioTracks = ref([]);
  const audioTrack = shallowRef(-1);
  const disableUI = ref(false);

  const { ignoreUpdates: ignoreSeekingUpdates } = watchIgnorable(currentTime, (time) => {
    command('seek', time);
  });
  const { ignoreUpdates: ignorePlayingUpdates } = watchIgnorable(playing, (isPlaying) => {
    if (isPlaying) {
      command('play');
    }
    else {
      command('pause');
    }
  });
  const { ignoreUpdates: ignoreRateUpdates } = watchIgnorable(rate, (rate) => {
    command('speed', rate);
  });
  const { ignoreUpdates: ignoreVolumeUpdates } = watchIgnorable(volume, (volume) => {
    command('volume', volume);
  });
  const { ignoreUpdates: ignoreMuteUpdates } = watchIgnorable(muted, (isMuted) => {
    if (isMuted) {
      command('mute');
    }
    else {
      command('unmute');
    }
  });
  const { ignoreUpdates: ignoreLoopUpdates } = watchIgnorable(loop, (bool) => {
    command('loop', bool);
  });
  const { ignoreUpdates: ignoreSelectedAudioTrackUpdates } = watchIgnorable(audioTrack, (track) => {
    command('audiotrack', track);
  });
  const { ignoreUpdates: ignoreQualityUpdates } = watchIgnorable(quality, (quality) => {
    command('quality', quality);
  });

  const iframeReady = new Promise((resolve) => {
    const { off } = sourceLoadedEvent.on(() => {
      resolve(true);
      off();
    });
  });
  const playerReady = new Promise((resolve) => {
    const { off } = playerIsReadyEvent.on(() => {
      resolve(true);
      off();
    });
  });

  const handlers = {
    canplay: () => playerIsReadyEvent.trigger(),
    timeupdate: (data) => ignoreSeekingUpdates(() => currentTime.value = data),
    durationchange: (data) => duration.value = data,
    progress: (data) => buffered.value = data,
    seeking: () => seeking.value = true,
    seeked: () => seeking.value = false,
    waiting: () => {
      waiting.value = true;
      ignorePlayingUpdates(() => playing.value = false);
    },
    loadstart: () => {
      waiting.value = true;
      ignorePlayingUpdates(() => playing.value = false);
    },
    loadeddata: () => waiting.value = false,
    playing: () => {
      waiting.value = false;
      ended.value = false;
      ignorePlayingUpdates(() => playing.value = true);
    },
    ratechange: (data) => ignoreRateUpdates(() => rate.value = data),
    stalled: () => stalled.value = true,
    ended: () => ended.value = true,
    pause: () => ignorePlayingUpdates(() => playing.value = false),
    play: () => ignorePlayingUpdates(() => playing.value = true),
    enterpictureinpicture: () => isPictureInPicture.value = true,
    leavepictureinpicture: () => isPictureInPicture.value = false,
    volumechange: (data) => {
      ignoreVolumeUpdates(() => volume.value = data.volume);
      ignoreMuteUpdates(() => muted.value = data.muted);
    },

    qualities: (data) => qualities.value = data,
    quality: (data) => ignoreQualityUpdates(() => quality.value = data),
    audioTracks: (data) => audioTracks.value = data,
    audioTrack: (data) => ignoreSelectedAudioTrackUpdates(() => audioTrack.value = data),
    // loop: (data) => ignoreLoopUpdates(() => loop.value = data === 1),
  };

  return {
    currentTime,
    duration,
    waiting,
    seeking,
    ended,
    stalled,
    buffered,
    playing,
    rate,
    loop,
    togglePlay: () => playing.value = !playing.value,
    toggleMute: () => muted.value = !muted.value,
    endBuffer: computed(() => buffered.value.length ? buffered.value.at(-1)?.[1] ?? 0 : 0),
    disableUI,

    // Volume
    volume,
    muted,

    // Tracks
    tracks,
    selectedTrack,
    enableTrack: () => null,
    disableTrack: () => null,

    // Qualities
    qualities,
    quality,

    // Translations audio tracks
    audioTracks,
    audioTrack,

    // Picture in Picture
    supportsPictureInPicture: false,
    togglePictureInPicture: () => Promise.resolve(),
    isPictureInPicture,

    // Events
    onSourceError: sourceErrorEvent.on,
    onPlaybackError: playbackErrorEvent.on,

    // iframe
    command,
    loadSource,
  };

  /**
   * Send command to the iframe
   * @param {string} command
   * @param {any=} args
   */
  function command(command, args) {
    const el = toValue(iframe);

    el.contentWindow?.postMessage({
      command,
      args,
    }, '*');
  }

  /**
   * @param {string} source direct link to iframe
   * @return {Promise<void>}
   */
  async function loadSource(source) {
    const el = toValue(iframe);
    const src = new URL(source);

    el.setAttribute('allow', 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    el.setAttribute('frameborder', '0');
    el.src = src.toString();

    await iframeReady;
    await playerReady;
  }

  /**
   * Handle messages from the iframe to make state reactive
   * @param {MessageEvent} event
   */
  function messageListener(event) {
    const el = toValue(iframe);

    if (event.source !== el.contentWindow || !event.data) {
      return;
    }

    const { data, event: eventName } = event.data;

    if (handlers[eventName]) {
      const handler = handlers[eventName];

      if (handler.length === 1 && data !== undefined) {
        handler(data);
      }
      else {
        handler();
      }
    }
  }
}
