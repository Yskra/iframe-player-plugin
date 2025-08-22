/** @import {Player} from './Public' */

import logger from './lib/logger.js';
import createDashPlayer from './lib/players/dash.js';
import createHlsPlayer from './lib/players/hls.js';
import createNativePlayer from './lib/players/native.js';
import createVenomPlayer from './lib/players/venom.js';

/** @type Player[] */
const players = [
  createNativePlayer,
  createDashPlayer,
  createHlsPlayer,
  createVenomPlayer,
];
/** @type {Set<(command: string, data: any) => void>} */
const receiveMessageHandlers = new Set();


(() => {
  window.addEventListener('message', onMessage);

  for (const player of players) {
    player(sendMessage, onReceiveMessage)
      .catch((err) => {
        logger.error(player.name, err);
      });
  }
})();

function sendMessage(event, data) {
  window.parent.postMessage({ event, data }, '*');
}

function onReceiveMessage(handler) {
  receiveMessageHandlers.add(handler);
}

/**
 * @param {Event} event
 */
function onMessage(event) {
  if (event.origin === window.location.origin) {
    return;
  }

  const { command, args } = event.data;

  if (!command) {
    return;
  }

  for (const handler of receiveMessageHandlers) {
    handler(command, args);
  }
}
