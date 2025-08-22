/** @import {Player} from '../Public' */

import logger from '../logger.js';
import waitGlobalField from '../waitGlobalField.js';

/**
 * @type {Player}
 */
export default async function createDashPlayer(sendMessage, onReceiveMessage) {
  const ok = await waitGlobalField('dashjs');

  if (!ok) {
    return;
  }

  logger.info('patching dashjs');

  const originalCreate = window.dashjs.MediaPlayer.prototype.create;

  dashjs.MediaPlayer.prototype.create = function (...args) {
    const instance = originalCreate.apply(this, args);

    setupDashEventForwarding(instance, dashjs.MediaPlayer, sendMessage);
    setupDashCommandReceiver(instance, dashjs.MediaPlayer, onReceiveMessage);

    return instance;
  };
}

function setupDashEventForwarding(instance, MediaPlayer, sendMessage) {
  instance.on(MediaPlayer.events.MANIFEST_LOADED, ({ data }) => {
    console.log('Manifest loaded', data);
    sendMessage('qualities', data.levels);
  });
  instance.on(MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e) => {
    sendMessage('quality', e.newQuality);
  });
}

function setupDashCommandReceiver(instance, dashjs, onReceiveMessage) {
  onReceiveMessage(messageListener);

  const handlers = {
    // quality: (hls, args) => hls.loadLevel = args,
  };


  function messageListener(command, args) {
    // if (handlers[command]) {
    //   handlers[command](instance, Hls, args);
    // }
  }
}
