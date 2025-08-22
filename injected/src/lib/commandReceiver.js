export default function setupMediaCommandReceiver(mediaElement) {
  /** @type {Record<keyof HTMLMediaElementEventMap, (el: HTMLMediaElement) => any>} */
  const handlers = {
    play: (el) => el.play(),
    pause: (el) => el.pause(),
    seek: (el, args) => el.currentTime = args,
    speed: (el, args) => el.playbackRate = args,
    volume: (el, args) => el.volume = args,
    mute: () => mediaElement.muted = true,
    unmute: () => mediaElement.muted = false,
    loop: (el, args) => el.loop = args,
    audiotrack: (el, args) => mediaElement.audioTracks[args].enabled = true,
  };


  window.addEventListener('message', handleCommand);

  /**
   * @param {MessageEvent} event
   */
  function handleCommand(event) {
    if (event.origin === window.location.origin) {
      return;
    }

    const { command, args } = event.data;

    if (handlers[command]) {
      handlers[command](mediaElement, args);
    }
    else {
      console.warn('Unknown command:', command);
    }
  }

  return () => {
    window.removeEventListener('message', handleCommand);
  };
}
