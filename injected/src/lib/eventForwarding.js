export default function setupMediaEventForwarding(mediaElement) {
  const mediaEvents = [
    'play',
    'pause',
    'playing',
    'waiting',
    'seeking',
    'seeked',
    'ended',
    'loadeddata',
    'loadedmetadata',
    'error',
    'timeupdate',
    'volumechange',
    'ratechange',
    'durationchange',
    'fullscreenchange',
    'enterpictureinpicture',
    'leavepictureinpicture',
    'canplay',
  ];

  /** @type {Record<keyof HTMLMediaElementEventMap, (el: HTMLMediaElement) => any>} */
  const handlers = {
    timeupdate: (el) => el.currentTime,
    durationchange: (el) => el.duration,
    progress: (el) => timeRangeToArray(el.buffered),
    // seeked
    // seeking
    // waiting, loadstart
    // loadeddata
    // playing
    ratechange: (el) => el.playbackRate,
    // stalled
    // ended
    // pause
    // play
    // enterpictureinpicture,
    // leavepictureinpicture,
    volumechange: (el) => ({ volume: el.volume, muted: el.muted }),
    error: (el) => ({ code: el.error.code, message: el.error.message }),
  };

  mediaEvents.forEach((event) => {
    mediaElement.addEventListener(event, ({ type, target }) => messenger(type, target));
  });

  /**
   * @param {string} type
   * @param {any} data
   */
  function messenger(type, data) {
    const message = { event: type };

    if (handlers[type]) {
      message.data = handlers[type](data);
    }
    window.parent.postMessage(message, '*');
  }

  return () => {
    mediaEvents.forEach((event) => {
      mediaElement.removeEventListener(event, () => {});
    });
  };
}


function timeRangeToArray(timeRanges) {
  /** @type {[number, number][]} */
  let ranges = [];

  for (let i = 0; i < timeRanges.length; ++i)
    ranges = [...ranges, [timeRanges.start(i), timeRanges.end(i)]];

  return ranges;
}
