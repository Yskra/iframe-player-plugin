/** @import {Player} from '../Public' */

import logger from '../logger.js';
import waitGlobalField from '../waitGlobalField.js';

/**
 * @type {Player}
 */
export default async function createHlsPlayer(sendMessage, onReceiveMessage) {
  const ok = await waitGlobalField('Hls');

  if (!ok) {
    return;
  }

  logger.info('patching Hls');

  const OriginalHls = window.Hls;

  function HlsWrapper(config) {
    const instance = new OriginalHls(config);

    setupHlsEventForwarding(instance, OriginalHls, sendMessage);
    setupHlsCommandReceiver(instance, OriginalHls, onReceiveMessage);

    return instance;
  }

  Object.defineProperties(HlsWrapper, Object.getOwnPropertyDescriptors(OriginalHls));

  window.Hls = HlsWrapper;
}


function setupHlsEventForwarding(instance, Hls, sendMessage) {
  instance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
    logger.info('hls manifest parsed', data);
    sendMessage('qualities', data.levels);
  });
  instance.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
    sendMessage('quality', data.level);
  });
}

function setupHlsCommandReceiver(instance, Hls, onReceiveMessage) {
  onReceiveMessage(messageListener);

  const handlers = {
    quality: (hls, args) => hls.loadLevel = args,
  };

  function messageListener(command, args) {
    if (handlers[command]) {
      handlers[command](instance, Hls, args);
    }
  }
}
