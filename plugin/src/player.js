/** @import {ComputedRef} from 'vue' */

import { reactive } from 'vue';
import { usePlayerAPI } from './playerAPI.js';

/**
 * @param {ComputedRef<string>} apiEndpoint
 */
export default function usePlayerIframe(apiEndpoint) {
  return (mediaElement, options = { noProxy: false }) => {
    hardwareSupport();

    const iframe = createIframe();
    const originalElement = mediaElement;
    const player = usePlayerAPI(iframe);
    const mediaControls = reactive({ ...player });

    mediaElement.parentNode?.replaceChild(iframe, mediaElement);

    return {
      mediaControls,
      load,
      destroy,
      onPlayerError: player.onSourceError,
    };

    function createIframe() {
      const iframe = document.createElement('iframe');

      iframe.classList.add('w-full', 'h-full');

      return iframe;
    }

    function hardwareSupport() {
      if ('postMessage' in window) {
        return;
      }
      return new Error('Not supported iframe player');
    }

    /**
     * @param {string} src
     */
    async function load(src) {
      if (options.noProxy) {
        mediaControls.disableUI = true;
        iframe.classList.remove('pointer-events-none');

        await player.loadSource(`${src}`);
      }
      else {
        mediaControls.disableUI = false;
        iframe.classList.add('pointer-events-none');

        await player.loadSource(`${apiEndpoint.value.origin}/${src}`);
      }
    }

    function destroy() {
      if (iframe) {
        iframe.parentNode?.replaceChild(originalElement, iframe);
        iframe.remove();
      }
    }
  };
}
