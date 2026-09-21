import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'src/api/generated.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
    },
  },
];
