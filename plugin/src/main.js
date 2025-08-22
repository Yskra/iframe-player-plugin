import { useAppBus } from 'utils';
import { computed } from 'vue';
import usePlayerIframe from './player.js';

export default function plugin({ defineConfig }) {
  const config = defineConfig({
    proxyEndpoint: import.meta.env.DEV ? 'http://localhost:5174' : import.meta.env.VITE_PROXY_ENDPOINT,
  });
  const apiEndpoint = computed(() => new URL(config.proxyEndpoint));

  const bus = useAppBus();

  const rmPlayer = bus.call('webPlayer.custom:add', {
    name: 'iframe',
    canPlay: (_, mimeType) => mimeType === 'text/html' || mimeType === 'text/html; charset=UTF-8',
    create: usePlayerIframe(apiEndpoint),
  });

  return () => {
    rmPlayer();
  };
}
