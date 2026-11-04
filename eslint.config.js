import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': 'error',
    },
  },
  {
    files: ['scripts/**/*.{mjs,cjs}'],
    languageOptions: { globals: { console: 'readonly', require: 'readonly', process: 'readonly' } },
    rules: { 'no-console': 'off', '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
);
