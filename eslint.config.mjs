// ESLint (calidad). El formato lo hace Prettier: npm run format
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/', 'site-dist/', 'coverage/', 'playwright-report/', 'test-results/', 'node_modules/', '.base/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'site/**/*.ts'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },
  {
    files: ['test/**/*.{ts,mjs}', 'scripts/**/*.mjs', 'bin/**/*.mjs', 'site/**/*.mjs', '*.config.{js,mjs}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser, NexusExpediente: 'readonly' } },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty-pattern': 'off',
    },
  },
  prettier,
)
