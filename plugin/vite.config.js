import { resolve } from 'node:path';
import process from 'node:process';

import vuePlugin from '@vitejs/plugin-vue';
import replaceImportsWithVarsPlugin from 'rollup-plugin-replace-imports-with-vars';
import { defineConfig } from 'vite';

const target = process.env.TARGET ?? './plugin';
const workingDir = resolve(target);
const manifestPath = resolve(workingDir, 'manifest.json');

export default defineConfig(async ({ mode }) => {
  const isDev = mode === 'development';
  const manifest = await import(manifestPath, { with: { type: "json" } }).then((m) => m.default);

  return {
    envDir: workingDir,
    build: {
      target: 'chrome58',
      outDir: isDev ? resolve('../yskra/plugins') : resolve('./dist'),
      emptyOutDir: false,
      watch: isDev ? ({}) : null,
      minify: isDev ? false : 'esbuild',
      lib: {
        entry: resolve(workingDir, 'src/main.js'),
        fileName: `${manifest.name.toLowerCase().replace(/\s/g, '_')}`,
        formats: ['es', 'system'],
      },
      rollupOptions: {
        external: ['vue', 'pinia', 'vue-router', 'utils', 'vue-i18n', 'arrow-navigation', 'vue-vnode-utils'],
      },
    },
    plugins: [
      vuePlugin(),
      styleInjectPlugin(),
      replaceImportsWithVarsPlugin({ // anyway it's use for es target
        varType: 'const',
        replacementLookup: {
          'vue': `Yskra.import('vue')`,
          'vue-router': `Yskra.import('router')`,
          'vue-i18n': `Yskra.import('i18n')`,
          'pinia': `Yskra.import('pinia')`,
          'utils': `Yskra.import('utils')`,
        },
      }),
      manifestInjectPlugin(manifest),
    ],
    resolve: {
      alias: {
        '@': resolve(workingDir, 'src'),
      },
    },
  };
});

// build manifest.json to JSDoc
function manifestInjectPlugin(manifest) {
  return {
    name: 'manifest-inject',

    generateBundle(options, chunks) {
      Object.values(chunks).forEach((chunk) => {
        const jsdoc = generateJsdoc({ ...manifest, runtime: options.format });
        chunk.code = `${jsdoc}\n\n${chunk.code}`;
      });
    },
  };

  function generateJsdoc(manifest) {
    const pad = Object.keys(manifest).reduce((acc, key) => acc > key.length ? acc : key.length, 0);

    return `/**\n${
      Object.entries(manifest)
        .reduce(reduceValues, [])
        .map(([k, v]) => ` * @${k.padEnd(pad)}  ${v}`)
        .join('\n')
    }\n*/`;
  }

  function reduceValues(acc, [key, value]) {
    let result;

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result = value.map((v) => [key, v]);
      } else {
        result = Object.entries(value).map(([k, v]) => [key, `${k}:${v}`]);
      }
      result = result.flat();
    } else {
      result = [key, value];
    }

    return [...acc, result];
  }
}

// inject stylesheets to JS bundle as virtual module
function styleInjectPlugin() {
  const VIRTUAL_MODULE_NAME = 'virtual:styles';
  const MODULE_ID = `\0${VIRTUAL_MODULE_NAME}`;
  const REPLACE_PATTERN = '__virtual_styles__';

  return {
    apply: 'build',
    enforce: 'post',
    name: 'style-inject',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_NAME) {
        return MODULE_ID;
      }
    },
    load(id) {
      if (id === MODULE_ID) {
        return `export default ${REPLACE_PATTERN}`;
      }
    },
    generateBundle(opts, bundle) {
      let styleCode = '';

      for (const key in bundle) {
        const chunk = bundle[key];

        if (chunk?.type === 'asset' && chunk.fileName.includes('.css')) {
          styleCode += chunk.source;
          delete bundle[key];
        }
      }

      for (const key in bundle) {
        const chunk = bundle[key];

        if (chunk?.type === 'chunk' && chunk.fileName.includes('.js')) {
          chunk.code = chunk.code.replace(REPLACE_PATTERN, JSON.stringify(styleCode));
          break;
        }
      }
    },
  };
}
