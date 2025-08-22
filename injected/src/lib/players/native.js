/** @import {Player} from '../Public' */

import logger from '../logger.js';
import waitForElement from '../waitForElement.js';

/**
 * @type {Player}
 */
export default async function createNativePlayer(sendMessage, onReceiveMessage) {
  const $video = await waitForElement('video');

  if (!$video) {
    return;
  }

  logger.info('patching </video>', $video);

  setupMediaEventForwarding($video, sendMessage);
  setupMediaCommandReceiver($video, onReceiveMessage);
}

function setupMediaEventForwarding(mediaElement, sendMessage) {
  /** @type {Record<keyof HTMLMediaElementEventMap, (el: HTMLMediaElement) => any>} */
  const handlers = {
    timeupdate: (el) => el.currentTime,
    durationchange: (el) => el.duration,
    progress: (el) => timeRangeToArray(el.buffered),
    seeked: null,
    seeking: null,
    waiting: null,
    loadstart: null,
    loadeddata: null,
    playing: null,
    ratechange: (el) => el.playbackRate,
    stalled: null,
    ended: null,
    pause: null,
    play: null,
    enterpictureinpicture: null,
    leavepictureinpicture: null,
    volumechange: (el) => ({ volume: el.volume, muted: el.muted }),
    error: (el) => ({ code: el.error.code, message: el.error.message }),
  };

  Object.keys(handlers).forEach((e) => {
    mediaElement.addEventListener(e, ({ type, target }) => messenger(type, target));
  });

  /**
   * @param {string} type
   * @param {HTMLMediaElement} target
   */
  function messenger(type, target) {
    setTimeout(() => {
      sendMessage(type, handlers[type] ? handlers[type](target) : null);
    }, 100);
  }


  return () => {
    Object.keys(handlers).forEach((event) => {
      mediaElement.removeEventListener(event, () => {});
    });
  };

  function timeRangeToArray(timeRanges) {
    /** @type {[number, number][]} */
    let ranges = [];

    for (let i = 0; i < timeRanges.length; ++i)
      ranges = [...ranges, [timeRanges.start(i), timeRanges.end(i)]];

    return ranges;
  }
}

function setupMediaCommandReceiver(mediaElement, onReceiveMessage) {
  onReceiveMessage(handleCommand);

  /** @type {Record<keyof HTMLMediaElementEventMap, (el: HTMLMediaElement) => any>} */
  const handlers = {
    play: (el) => el.play(),
    pause: (el) => el.pause(),
    seek: (el, args) => el.currentTime = args,
    speed: (el, args) => el.playbackRate = args,
    volume: (el, args) => el.volume = args,
    mute: (el) => el.muted = true,
    unmute: (el) => el.muted = false,
    loop: (el, args) => el.loop = args,
  };


  function handleCommand(command, args) {
    if (handlers[command]) {
      handlers[command](mediaElement, args);
    }
  }
}

