import antfu from '@antfu/eslint-config';
import jsdoc from 'eslint-plugin-jsdoc';
import pluginVue from 'eslint-plugin-vue';

// noinspection JSUnusedGlobalSymbols
export default antfu(
  /** @type {import('antfu').OptionsConfig} */
  {
    stylistic: {
      semi: true,
      jsx: false,
    },
    formatters: true,
    jsonc: false,
    yaml: false,
    toml: false,
  },
  [
    ...pluginVue.configs['flat/essential'],
    {
      name: 'eslint conf',
      rules: {
        '@stylistic/padding-line-between-statements': [
          'error',
          { blankLine: 'always', prev: ['const', 'let'], next: '*' },
          { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
          { blankLine: 'always', prev: ['case', 'default'], next: '*' },
        ],
        '@stylistic/lines-between-class-members': [
          'error',
          {
            enforce: [
              { blankLine: 'always', prev: '*', next: 'method' },
              { blankLine: 'always', prev: 'method', next: '*' },
              { blankLine: 'never', prev: 'field', next: 'field' },
            ],
          },
        ],
        '@stylistic/arrow-parens': [
          'error',
          'always',
        ],
        '@stylistic/no-multiple-empty-lines': ['error', { max: 2 }],
        'unused-imports/no-unused-vars': ['error', { caughtErrors: 'none' }],
      },
    },
    {
      name: 'jsdoc',
      ...jsdoc.configs['flat/recommended'],
      rules: {
        'jsdoc/require-property-description': 0,
      },
    },
    {
      name: 'vue pages',
      files: ['**/pages/*.vue'],
      rules: {
        'vue/multi-word-component-names': 0,
      },
    },
    {
      name: 'vue',
      files: ['**/*.vue'],
      rules: {
        'vue/max-attributes-per-line': ['error', {
          singleline: { max: 2 },
          multiline: { max: 1 },
        }],
      },
    },
  ],
);
