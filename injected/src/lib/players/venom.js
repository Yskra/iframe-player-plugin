/** @import {Player} from '../Public' */

import logger from '../logger.js';
import waitGlobalField from '../waitGlobalField.js';

// известные ивенты VenomPlayer
// close
// loadstart - HTMLMediaElement
// levelSwitch - number
// audioList - string[]
// audioSwitch - number
// ready
// play - HTMLMediaElement
// waiting - HTMLMediaElement
// progress - HTMLMediaElement
// ratechange - HTMLMediaElement
// timeupdate - HTMLMediaElement
// volumechange - HTMLMediaElement
// seeking - HTMLMediaElement
// peersHave - "audio 0 / 0" // чтобы это не значило
// stats - {
//   "totalDownloaded": {
//     "http": 1436,
//     "ws": 0,
//     "p2p": 0,
//     "db": 0,
//     "mem": 0
//   },
//   "totalP2PUploaded": 0
// }
// fragLoaded - {
//   "type": "audio",
//   "level": 0,
//   "sn": 0,
//   "url": "https://...",
//   "source": "http",
//   "size": 55473,
//   "time": 244,
//   "by": "dash"
// }
// has - {
//   "channel": "705229d",
//   "type": "audio",
//   "level": 0,
//   "sn": 0,
//   "data": {},
//   "size": 55473,
//   "fromPeerId": ""
// }


/**
 * @type {Player}
 */
export default async function createVenomPlayer(sendMessage, onReceiveMessage) {
  const ok = await waitGlobalField('VenomPlayer');

  if (!ok) {
    return;
  }

  logger.info('patching VenomPlayer');

  const OriginalVenomPlayer = window.VenomPlayer;
  const descriptors = Object.getOwnPropertyDescriptors(OriginalVenomPlayer);
  const VenomPlayerWrapper = {};

  descriptors.make = {
    value(...args) {
      const instance = OriginalVenomPlayer.make.apply(this, args);

      setupVenomEventForwarding(instance, args[0], sendMessage);
      setupVenomCommandReceiver(instance, args[0], onReceiveMessage);

      logger.info('VenomPlayer config', args[0]);

      return instance;
    },
    writable: false,
    configurable: false,
    enumerable: false,
  };

  Object.defineProperties(VenomPlayerWrapper, descriptors);

  window.VenomPlayer = VenomPlayerWrapper;
}

function setupVenomEventForwarding(instance, config, sendMessage) {
  sendMessage('qualities', Object.values(config.qualityByWidth).map((name) => ({ name })));
  sendMessage('audioTracks', config.source?.audio?.names?.map((name) => ({ name })) ?? []);

  instance.on('levelSwitch', (e) => {
    sendMessage('quality', e);
  });

  instance.on('audioList', (e) => {
    sendMessage('audioTracks', e.map((name) => ({ name })));
  });
  instance.on('audioSwitch', (e) => {
    sendMessage('audioTrack', e);
  });
}

function setupVenomCommandReceiver(instance, config, onReceiveMessage) {
  onReceiveMessage(messageListener);

  const handlers = {
    quality: (venomPlayer, config, args) => {
      venomPlayer._settings._selectQuality(Object.values(config.qualityByWidth)[args]);
    },
    audiotrack: (venomPlayer, config, args) => {
      venomPlayer._settings._selectSound((config.source?.audio?.names ?? [])[args]);
    },
  };

  function messageListener(command, args) {
    if (handlers[command]) {
      handlers[command](instance, config, args);
    }
  }
}

